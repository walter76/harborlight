# Runbook — Adding a New Web App to Traefik

**Audience:** Developer adding a new containerized web app to the production environment
**Result:** The app is routed by Traefik and appears as a card in the Harborlight dashboard

---

## Overview

Traefik routes incoming requests to app containers based on routing rules. Harborlight discovers
apps by reading those rules from the Traefik API — no manual Harborlight configuration is needed.

There are two ways to register an app with Traefik:

| Method | Best for |
|--------|----------|
| **File provider** (edit `dynamic.yml`) | Apps managed outside of Docker Compose, or when you prefer centralised routing config |
| **Docker labels** | Apps managed with Docker Compose on the same host |

Both are covered below. Use whichever matches your deployment.

---

## How Harborlight will display the app

Harborlight derives the card name from the Traefik router name by:

1. Stripping everything from `@` onward (e.g. `@docker`)
2. Stripping trailing suffixes: `-router`, `-http`, `-https`
3. Capitalising each word separated by `-` or `_`

| Router name | Displayed as |
|-------------|--------------|
| `my-cool-app-router@docker` | My Cool App |
| `my-cool-app@docker` | My Cool App |
| `inventory_service-router` | Inventory Service |

**Routers are excluded from Harborlight if their name contains `@internal` or `dashboard`.** Do not
use either of those words in a router name you want to appear in the dashboard.

The scheme shown on the card is determined by the router's entry point:
- Entry point name contains `https` or `websecure` → card shows `https`
- Anything else → card shows `http`

---

## Method A — File provider

Use this when your production Traefik is configured with the file provider (i.e. a `dynamic.yml`
or equivalent dynamic configuration file).

### 1. Join the app to the Traefik network

The app container must be on the same Docker network as Traefik so that Traefik can reach it.

```bash
# If using docker run
docker run --network traefik-net --name my-cool-app my-cool-app-image

# If using Docker Compose, add the network to the service
```

```yaml
# docker-compose.yml for the app
services:
  my-cool-app:
    image: my-cool-app-image
    container_name: my-cool-app
    networks:
      - traefik-net

networks:
  traefik-net:
    external: true
    name: traefik-net   # must match the name of the existing Traefik network
```

### 2. Add the router and service to `dynamic.yml`

Open the Traefik dynamic configuration file (e.g. `/etc/traefik/dynamic.yml`) and add entries
under `http.routers` and `http.services`.

**HTTP app (host-based routing):**
```yaml
http:
  routers:
    my-cool-app:                                  # becomes "My Cool App" in Harborlight
      rule: "Host(`myapp.example.com`)"
      entryPoints:
        - web
      service: my-cool-app

  services:
    my-cool-app:
      loadBalancer:
        servers:
          - url: "http://my-cool-app:80"          # container name and internal port
```

**HTTPS app (with TLS):**
```yaml
http:
  routers:
    my-cool-app:
      rule: "Host(`myapp.example.com`)"
      entryPoints:
        - websecure                               # triggers https scheme in Harborlight
      service: my-cool-app
      tls:
        certResolver: letsencrypt                 # adjust to your cert resolver

  services:
    my-cool-app:
      loadBalancer:
        servers:
          - url: "http://my-cool-app:80"          # internal traffic is still http
```

**App on a path prefix (sharing a hostname):**
```yaml
http:
  routers:
    my-cool-app:
      rule: "Host(`example.com`) && PathPrefix(`/myapp`)"
      entryPoints:
        - websecure
      service: my-cool-app
      tls:
        certResolver: letsencrypt

  services:
    my-cool-app:
      loadBalancer:
        servers:
          - url: "http://my-cool-app:80"
```

### 3. Reload Traefik

If `watch: true` is set in the Traefik static config (it is in the default setup), Traefik
picks up changes to `dynamic.yml` automatically — **no restart needed**.

Verify by checking the Traefik dashboard:
```
http://<production-server>:8080/dashboard/
```

The new router should appear under **HTTP Routers** within a few seconds.

---

## Method B — Docker labels

Use this when the app is managed with Docker Compose on the same host as Traefik, and Traefik is
configured with the Docker provider.

### 1. Add labels and network to the app's compose service

```yaml
services:
  my-cool-app:
    image: my-cool-app-image
    container_name: my-cool-app
    restart: unless-stopped
    networks:
      - traefik-net
    labels:
      - "traefik.enable=true"

      # Router rule
      - "traefik.http.routers.my-cool-app.rule=Host(`myapp.example.com`)"

      # Entry point — use 'websecure' for HTTPS, 'web' for HTTP
      - "traefik.http.routers.my-cool-app.entrypoints=websecure"

      # TLS (remove these two lines if HTTP only)
      - "traefik.http.routers.my-cool-app.tls=true"
      - "traefik.http.routers.my-cool-app.tls.certresolver=letsencrypt"

      # Internal port the container listens on
      - "traefik.http.services.my-cool-app.loadbalancer.server.port=80"

networks:
  traefik-net:
    external: true
    name: traefik-net
```

### 2. Start or recreate the service

```bash
docker compose up -d my-cool-app
```

Traefik detects the new container and its labels automatically.

---

## Step 3 — Verify in Traefik

Open the Traefik dashboard and confirm the router is listed and its status is **Enabled**:

```
http://<production-server>:8080/dashboard/#/http/routers
```

You can also query the Traefik API directly:

```bash
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("my-cool-app"))'
```

---

## Step 4 — Verify in Harborlight

Open the Harborlight dashboard. The new app card should appear automatically within one
auto-refresh cycle (no restart or config change needed).

Confirm:
- The card name matches the expected humanized form (see the table at the top of this runbook)
- The scheme (http/https) is correct
- Clicking the card opens the app at the correct URL

If the card does not appear, check:

| Problem | Likely cause |
|---------|-------------|
| Card missing entirely | Router name contains `@internal` or `dashboard`; or the router has no `Host()` or `PathPrefix()` rule |
| Wrong scheme on the card | Entry point name does not contain `https` or `websecure` |
| Wrong port in the URL | `WEB_APPS_HTTP_PORT` / `WEB_APPS_HTTPS_PORT` env vars on the backend do not match Traefik's exposed host ports |
| Card name looks wrong | Adjust the router name — see naming conventions at the top of this runbook |

---

## Removing an app

Remove the router and service entries from `dynamic.yml` (file provider), or remove / set
`traefik.enable=false` on the container labels (Docker provider), then stop and remove the
container.

Harborlight will stop showing the card on the next refresh.
