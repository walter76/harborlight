# harborlight

A self-hosted web app dashboard for Traefik. Discovers HTTP routers automatically and displays them as a clean,
clickable card grid. Built with Rust and React.

## Dev Environment

The dev environment spins up a local Traefik instance with three dummy nginx services using Docker Compose.

**Prerequisites:** Docker Desktop running on Windows.

**Start:**
```bat
dev-env\start.bat
```

**Stop:**
```bat
docker compose -f dev-env\docker-compose.yml down
```

Once running:

| URL | Description |
|-----|-------------|
| http://localhost:8080/dashboard/ | Traefik dashboard |
| http://localhost:8080/api/http/routers | Traefik router API (JSON) |
| http://alpha.localhost:8081 | Dummy app alpha |
| http://beta.localhost:8081 | Dummy app beta |
| http://gamma.localhost:8081 | Dummy app gamma |

## Backend

The backend queries the Traefik API and exposes a REST API for the frontend.

**Run (requires dev environment running):**
```bash
cd src/harborlight-backend
cargo run
```

The server starts on port 8083 by default. Override with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAEFIK_API_URL` | `http://localhost:8080` | Traefik API endpoint |
| `PORT` | `8083` | Backend listen port |
| `WEB_APPS_HTTP_PORT` | `80` | Host port for HTTP web apps (set if Traefik HTTP is not on port 80) |
| `WEB_APPS_HTTPS_PORT` | `443` | Host port for HTTPS web apps (set if Traefik HTTPS is not on port 443) |
| `RUST_LOG` | — | Log level (`info`, `debug`, etc.) |

**Test the API endpoints:**
```bash
# Health check
curl http://localhost:8083/health

# Discovered apps (from Traefik routers)
curl http://localhost:8083/api/apps
```

**Run tests:**
```bash
cd src/harborlight-backend
cargo test
```

## Frontend

The frontend is a React/Vite app served by nginx in production.

**Run (dev, requires backend running):**
```bash
cd src/harborlight-app
npm install
npm run dev
```

The dev server starts on http://localhost:5173 and proxies `/api` and `/health` to the backend.

## Docker

Build both containers with the provided PowerShell script:

```powershell
.\scripts\build-containers.ps1
```

Or build individually:

```powershell
docker build -t harborlight-backend src\harborlight-backend
docker build -t harborlight-app src\harborlight-app
```

The frontend container (nginx, port 80) proxies `/api` and `/health` to a backend container named `harborlight-backend` on port 8083. Both containers must be on the same Docker network.
