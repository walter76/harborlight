Implement the React/Vite frontend for Harborlight.

## Context
Harborlight is a self-hosted services dashboard that auto-discovers web applications 
registered in Traefik. The Rust/Axum backend is already running and exposes two endpoints.
The frontend project is scaffolded but empty.

## Backend API

### GET /health
Returns backend health status.
Response: { "status": "ok" }

### GET /api/services
Returns all Traefik-registered services.
Response shape to confirm from actual code — assume this until corrected:
{
  "services": [
    {
      "name": "grafana",
      "url": "http://localhost:8088/grafana",
      "status": "healthy" | "degraded" | "unknown"
    }
  ]
}

⚠️ IMPORTANT: Before writing any frontend code, read the Rust source files 
(src/main.rs and any route/handler modules) to find the exact API route paths 
and response shapes. Derive the component prop shapes from the actual Rust structs.
Do not guess.

## What to Build

A single-page dashboard with:

1. **Service Cards Grid**
   - Responsive grid layout (2-3 columns on desktop, 1 on mobile)
   - Each card shows: service name, URL/route, health status chip, 
     and a clickable "Open" button that opens the service in a new tab

2. **Health Status Indicators**
   - MUI Joy Chip per card: color="success" = healthy, color="warning" = degraded, 
     color="neutral" = unknown
   - A summary line at the top: "X of Y services healthy"

3. **Loading & Error States**
   - Skeleton cards on initial load (use MUI Joy Skeleton)
   - Alert banner if /api/services is unreachable (use MUI Joy Alert)

## Tech Constraints
- React + JavaScript (no TypeScript, no .ts/.tsx files)
- MUI Joy UI as the component library (@mui/joy)
- Do NOT use @mui/material — Joy UI only
- No Tailwind
- Functional components + hooks only, no class components
- Keep components small and single-responsibility

## Dependencies to install
Run this before scaffolding components:
npm install @mui/joy @emotion/react @emotion/styled

## File Structure to Create
src/
  components/
    ServiceCard.jsx
    ServiceGrid.jsx
    HealthChip.jsx
    StatusBar.jsx
    SkeletonCard.jsx
    ErrorBanner.jsx
  hooks/
    useServices.js       ← fetching + polling logic
  App.jsx
  main.jsx               ← likely already exists, leave unless broken

Also configure vite.config.js to proxy /api/* and /health to the Rust backend 
port so the dev server works without CORS issues. Read the existing vite config 
first to find the correct port, or check how the backend is started.

## Definition of Done
1. All components render without console errors
2. `npm run build` completes successfully
3. The grid displays correctly with both real and mock data
4. Clicking "Open" on a card navigates to the service URL in a new tab
5. MUI Joy CssVarsProvider wraps the app in main.jsx for theming

Start by reading the Rust source to extract exact API paths and response shapes.
Then implement components bottom-up:
HealthChip → ServiceCard → SkeletonCard → ErrorBanner → StatusBar → ServiceGrid → App.
Run `npm run build` at the end and fix any errors before finishing.