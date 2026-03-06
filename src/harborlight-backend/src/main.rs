mod handlers;

use std::sync::Arc;

use axum::{Router, routing::get};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

#[derive(Debug, Clone)]
struct AppConfig {
    traefik_api_url: String,
    port: u16,
}

impl AppConfig {
    fn from_env() -> Self {
        let traefik_api_url = std::env::var("TRAEFIK_API_URL")
            .unwrap_or_else(|_| "http://localhost:8080".to_string());
        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse()
            .unwrap_or(8080);

        Self {
            traefik_api_url,
            port,
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let config = Arc::new(AppConfig::from_env());
    info!("Connecting to Traefik API at {}", config.traefik_api_url);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(handlers::health))
        .layer(cors)
        .with_state(config.clone());

    let addr = format!("0.0.0.0:{}", config.port);
    info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
