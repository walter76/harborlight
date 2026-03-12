use std::sync::Arc;

use crate::AppConfig;

use anyhow::Result;
use axum::{Json, extract::State};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tracing::{error, info};

pub async fn health() -> &'static str {
    "ok"
}

pub async fn get_apps(
    State(config): State<Arc<AppConfig>>,
) -> Result<Json<Vec<WebApp>>, (StatusCode, String)> {
    match fetch_apps(&config).await {
        Ok(apps) => Ok(Json(apps)),
        Err(e) => {
            error!("Error fetching apps: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch apps".to_string(),
            ))
        }
    }
}

#[derive(Debug, Deserialize)]
struct TraefikRouter {
    name: Option<String>,
    rule: Option<String>,
    service: Option<String>,
    status: Option<String>,
    #[serde(rename = "entryPoints")]
    entry_points: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Clone, Eq, PartialEq)]
enum RulePart {
    Host(String),
    PathPrefix(String),
    FullUrl(String),
    Unknown(String),
}

#[derive(Debug, Serialize, Clone)]
pub struct WebApp {
    id: String,
    name: String,
    scheme: String,
    port: u16,
    rule_part: RulePart,
    status: String,
    entry_points: Vec<String>,
}

async fn fetch_apps(config: &AppConfig) -> Result<Vec<WebApp>> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/http/routers", config.traefik_api_url);

    let routers: Vec<TraefikRouter> = client.get(&url).send().await?.json().await?;

    info!("{:?}", routers);

    let apps = routers
        .into_iter()
        .filter_map(|router| {
            let name = router.name.clone()?;

            // skip internal Traefik routers
            if name.contains("@internal") || name.contains("dashboard") {
                return None;
            }

            let status = router.status.unwrap_or_else(|| "unknown".to_string());
            let rule_part = extract_url_from_rule(router.rule.as_deref()?);
            let entry_points = router.entry_points.unwrap_or_default();

            // prefer https if available
            let scheme = if entry_points
                .iter()
                .any(|ep| ep.contains("https") || ep.contains("websecure"))
            {
                "https"
            } else {
                "http"
            };

            let port = if scheme == "https" { 443 } else { config.web_apps_http_port };

            let display_name = humanize_name(&name);

            Some(WebApp {
                id: name.clone(),
                name: display_name,
                scheme: scheme.to_string(),
                port,
                rule_part,
                status,
                entry_points,
            })
        })
        .collect();

    Ok(apps)
}

fn extract_url_from_rule(rule: &str) -> RulePart {
    // parse Traefik rule like: Host(`example.com`), PathPrefix(`/app`) or Host(`example.com`) && PathPrefix(`/app`)
    let rule = rule.trim();

    // Check for Host(`example.com`)
    if let Some(host_start) = rule.find("Host(`") {
        let hostname_start = host_start + 6;

        let after = &rule[hostname_start..];

        if let Some(hostname_end) = after.find('`') {
            let hostname = &after[..hostname_end];

            // Check for Host(`example.com`) && PathPrefix(`/app`)
            if let Some(pp_start) = rule.find("PathPrefix(`") {
                let prefix_start = pp_start + 12;

                let after = &rule[prefix_start..];

                if let Some(prefix_end) = after.find('`') {
                    return RulePart::FullUrl(format!("{}{}", hostname, &after[..prefix_end]));
                }
            }

            // If no path prefix, just return the hostname
            return RulePart::Host(hostname.to_string());
        }
    }

    // Check for PathPrefix(`app`) without Host
    if let Some(pp_start) = rule.find("PathPrefix(`") {
        let prefix_start = pp_start + 12;

        let after = &rule[prefix_start..];

        if let Some(prefix_end) = after.find('`') {
            return RulePart::PathPrefix(format!("{}", &after[..prefix_end]));
        }
    }

    RulePart::Unknown(rule.to_string())
}

fn humanize_name(name: &str) -> String {
    // strip router suffix like "-router@docker"
    let cleaned = name
        .split('@')
        .next()
        .unwrap_or(name)
        .trim_end_matches("-router")
        .trim_end_matches("-http")
        .trim_end_matches("-https");

    // capitalize words separated by `-` or `_`
    cleaned
        .split(|c| c == '-' || c == '_')
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<String>>()
        .join(" ")
}
