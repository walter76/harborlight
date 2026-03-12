# Production Deployment Runbook

**Application:** Harborlight
**Components:** `harborlight-backend` (Rust/Axum), `harborlight-app` (React/nginx)
**Audience:** Developer performing a production deployment
**Prerequisites:** Docker is running on both the build machine and the production server.

---

## Overview

Harborlight runs as two Docker containers alongside an existing Traefik instance on the production server:

```
Browser → Traefik → harborlight-app (nginx, port 80)
                         ↓ proxy /api, /health
                  harborlight-backend (port 8083)
                         ↓
                  Traefik API (existing)
```

The backend must be able to reach the Traefik API endpoint. Both containers must be on the same Docker network so that the frontend nginx can proxy to the backend by container name.

---

## Step 1 — Gather production environment details

Before starting, confirm the following on the production server:

| Detail | Where to find it | Example |
|--------|-----------------|---------|
| Traefik API URL (internal) | Traefik config / `docker inspect` | `http://traefik:8080` |
| Traefik Docker network name | `docker network ls` | `traefik-net` |
| HTTP port exposed by Traefik | Traefik entrypoints config | `80` |
| HTTPS port exposed by Traefik | Traefik entrypoints config | `443` |
| Intended public URL for Harborlight | DNS / Traefik routing config | `https://harborlight.example.com` |

---

## Step 2 — Build the images (build machine)

Run the build script from the repo root:

```powershell
.\scripts\build-containers.ps1
```

This produces two local images: `harborlight-backend` and `harborlight-app`.

Verify the images were created:

```powershell
docker images harborlight-backend
docker images harborlight-app
```

---

## Step 3 — Transfer images to the production server

### Option A — Direct transfer (no registry)

Export, copy, and import the images:

```powershell
# On build machine — export images to tar files
docker save harborlight-backend | gzip > harborlight-backend.tar.gz
docker save harborlight-app     | gzip > harborlight-app.tar.gz

# Copy to production server (adjust user/host)
scp harborlight-backend.tar.gz user@prod-server:/tmp/
scp harborlight-app.tar.gz     user@prod-server:/tmp/
```

```bash
# On production server — load images
docker load < /tmp/harborlight-backend.tar.gz
docker load < /tmp/harborlight-app.tar.gz

# Clean up
rm /tmp/harborlight-backend.tar.gz /tmp/harborlight-app.tar.gz
```

### Option B — Private registry

```powershell
# On build machine — tag and push
docker tag harborlight-backend registry.example.com/harborlight-backend:latest
docker tag harborlight-app     registry.example.com/harborlight-app:latest

docker push registry.example.com/harborlight-backend:latest
docker push registry.example.com/harborlight-app:latest
```

```bash
# On production server — pull
docker pull registry.example.com/harborlight-backend:latest
docker pull registry.example.com/harborlight-app:latest

docker tag registry.example.com/harborlight-backend:latest harborlight-backend
docker tag registry.example.com/harborlight-app:latest     harborlight-app
```

---

## Step 4 — Create the production compose file (production server)

Create `/opt/harborlight/docker-compose.yml` on the production server. Substitute the values gathered in Step 1.

```yaml
services:

  harborlight-backend:
    image: harborlight-backend
    container_name: harborlight-backend
    restart: unless-stopped
    environment:
      TRAEFIK_API_URL: http://traefik:8080   # <-- adjust to your Traefik API URL
      PORT: "8083"
      WEB_APPS_HTTP_PORT: "80"               # <-- adjust if Traefik HTTP is not on 80
      WEB_APPS_HTTPS_PORT: "443"             # <-- adjust if Traefik HTTPS is not on 443
      RUST_LOG: info
    networks:
      - traefik-net

  harborlight-app:
    image: harborlight-app
    container_name: harborlight-app
    restart: unless-stopped
    networks:
      - traefik-net

networks:
  traefik-net:
    external: true
    name: traefik-net                        # <-- must match your existing Traefik network
```

> **Note:** Ports are intentionally not published to the host. Traefik routes external traffic into the containers over the shared Docker network.

---

## Step 5 — Configure Traefik routing (production server)

Add Harborlight to your Traefik configuration so it is reachable externally. The exact method depends on your Traefik provider (file or Docker labels).

### File provider

Add the following to your Traefik dynamic configuration file:

```yaml
http:
  routers:
    harborlight:
      rule: "Host(`harborlight.example.com`)"   # <-- your public hostname
      entryPoints:
        - websecure
      service: harborlight
      tls:
        certResolver: letsencrypt               # <-- your cert resolver, if using TLS

  services:
    harborlight:
      loadBalancer:
        servers:
          - url: "http://harborlight-app:80"
```

### Docker labels

Alternatively, add labels to the `harborlight-app` service in the compose file:

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.harborlight.rule=Host(`harborlight.example.com`)"
      - "traefik.http.routers.harborlight.entrypoints=websecure"
      - "traefik.http.routers.harborlight.tls.certresolver=letsencrypt"
      - "traefik.http.services.harborlight.loadbalancer.server.port=80"
```

---

## Step 6 — Start the containers (production server)

```bash
cd /opt/harborlight
docker compose up -d
```

---

## Step 7 — Verify the deployment (production server)

```bash
# Confirm both containers are running
docker compose ps

# Backend health check (from within the Docker network or via Traefik)
docker exec harborlight-backend wget -qO- http://localhost:8083/health

# Backend API — should return a JSON array of discovered apps
docker exec harborlight-backend wget -qO- http://localhost:8083/api/apps

# Check backend logs for errors
docker compose logs harborlight-backend

# Check frontend logs for errors
docker compose logs harborlight-app
```

Open the public URL in a browser and confirm Harborlight loads and displays the discovered apps.

---

## Step 8 — Update an existing deployment

```bash
# 1. Transfer new images to the server (repeat Step 3)

# 2. Restart containers with the new images
cd /opt/harborlight
docker compose down
docker compose up -d

# 3. Verify (repeat Step 7)
```

---

## Rollback

If the new deployment is broken, restore the previous images and restart:

```bash
cd /opt/harborlight

# Stop current containers
docker compose down

# Re-tag the previous images (if saved with a version tag)
docker tag harborlight-backend:previous harborlight-backend
docker tag harborlight-app:previous     harborlight-app

# Start with the restored images
docker compose up -d
```

> **Tip:** Before each deployment, tag the current running images as `:previous` so rollback is always one step away:
> ```bash
> docker tag harborlight-backend harborlight-backend:previous
> docker tag harborlight-app     harborlight-app:previous
> ```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Frontend loads but shows no apps | Backend cannot reach Traefik API | Check `TRAEFIK_API_URL` and that containers share a network with Traefik |
| App URLs have wrong port numbers | `WEB_APPS_HTTP_PORT` / `WEB_APPS_HTTPS_PORT` mismatch | Set env vars to match the ports Traefik exposes on the host |
| `harborlight-app` cannot proxy to backend | Containers on different networks | Ensure both are on the same `traefik-net` network |
| Traefik returns 404 for the public URL | Routing rule not applied | Check Traefik dynamic config or Docker labels; reload Traefik config |
| Container exits immediately | Startup error | Run `docker compose logs <service>` to inspect the error |
