use std::sync::Arc;

use crate::AppConfig;

use anyhow::Result;
use axum::extract::State;
use serde::Deserialize;
use tracing::info;

pub async fn health() -> &'static str {
    "ok"
}

pub async fn get_apps(State(config): State<Arc<AppConfig>>) {
    fetch_apps(&config).await.unwrap();
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

async fn fetch_apps(config: &AppConfig) -> Result<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/http/routers", config.traefik_api_url);

    let routers: Vec<TraefikRouter> = client
        .get(&url)
        .send()
        .await?
        .json()
        .await?;

    info!("{:?}", routers);
    
    Ok(())
}