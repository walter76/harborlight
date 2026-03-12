# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Harborlight is a self-hosted web app dashboard for Traefik that automatically discovers HTTP routers and displays them as a clean, clickable card grid. The project is a full-stack application with a Rust backend and React frontend in a monorepo structure.

## Architecture

### Backend (Rust)
- **Location**: `src/harborlight-backend/`
- **Framework**: Axum (async web framework on Tokio)
- **Purpose**: Queries Traefik API, transforms router data, serves REST API
- **Key files**:
  - `src/main.rs`: Server initialization, routing, CORS configuration
  - `src/handlers.rs`: Business logic for fetching and transforming Traefik routers

### Frontend (React)
- **Location**: `src/harborlight-app/`
- **Build tool**: Vite
- **Purpose**: Interactive UI for displaying discovered web apps
- Path-based routing (served under Traefik)
- Auto-refresh of the routers list
- Show: name, route, status, upstream health

### Data Flow
```
Traefik API → Rust Backend → REST API → React Frontend
             (Port 8080)   (Port 8083)   (Port 5173)
```

The backend queries Traefik's `/api/http/routers` endpoint, filters out internal routes (containing "@internal" or "dashboard"), and transforms them into `WebApp` objects with:
- Parsed routing rules (extracting Host/PathPrefix)
- Humanized names (stripped of Traefik suffixes like "@docker", "-router")
- Detected scheme (http/https based on entry points like "websecure")

## Development Commands

### Backend (Rust)
```bash
cd src/harborlight-backend

# Development
cargo build
cargo run

# Production build
cargo build --release

# Run tests
cargo test

# Docker
docker build -t harborlight-backend .
```

**Environment variables**:
- `TRAEFIK_API_URL`: Traefik API endpoint (default: `http://localhost:8080`)
- `PORT`: Backend server port (default: `8083`)
- `WEB_APPS_HTTP_PORT`: Host port for HTTP web apps (default: `80`; set if Traefik HTTP is not on port 80)
- `WEB_APPS_HTTPS_PORT`: Host port for HTTPS web apps (default: `443`; set if Traefik HTTPS is not on port 443)
- `RUST_LOG`: Logging level (e.g., `info`, `debug`)

### Frontend (React)
```bash
cd src/harborlight-app

# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Docker
docker build -t harborlight-app .
```

### Containers (PowerShell — run from repo root)
```powershell
# Build both containers
.\scripts\build-containers.ps1

# Or individually
docker build -t harborlight-backend src\harborlight-backend
docker build -t harborlight-app src\harborlight-app
```

The frontend nginx container proxies `/api` and `/health` to a container named `harborlight-backend:8083`. Both must be on the same Docker network.

## Key Implementation Details

### Backend REST API Endpoints
- `GET /health`: Health check (returns "ok")
- `GET /api/apps`: Returns array of WebApp objects from Traefik routers

### Traefik Rule Parsing
The `extract_url_from_rule()` function in `handlers.rs` parses Traefik routing rules:
- Extracts `Host()` directives (e.g., `Host(example.com)`)
- Extracts `PathPrefix()` directives (e.g., `PathPrefix(/app)`)
- Handles compound rules with both Host and PathPrefix
- Returns structured `RulePart` enum (Host, PathPrefix, FullUrl, or Unknown)

### Name Humanization
The `humanize_name()` function cleans Traefik router names by:
- Removing common Traefik suffixes: `@docker`, `-router`, `-http`, `-https`, `@internal`
- Capitalizing words separated by `-` or `_`

### CORS Configuration
Backend uses permissive CORS (allow any origin/method/header) for development convenience. Consider restricting this for production deployments.

### Frontend Conventions
- Functional components, hooks only
- No class components
- Keep components small and composable
- Always run `npm run build` after changes to verify
- Use JavaScript and React MUI Joy

## Dependencies

### Backend (Rust)
- `axum`: Web framework
- `tokio`: Async runtime
- `reqwest`: HTTP client for Traefik API
- `serde`/`serde_json`: Serialization
- `tower-http`: Middleware (CORS, filesystem)
- `tracing`/`tracing-subscriber`: Logging
- `anyhow`: Error handling

### Frontend (React)
- `react` v19: UI framework
- `vite`: Build tool and dev server
- `eslint`: Linting with React plugins

## Project Status

Current state: Fully implemented. Backend queries Traefik and serves the API. Frontend displays discovered web apps as a clickable card grid with status indicators and auto-refresh.
