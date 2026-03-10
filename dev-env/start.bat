@echo off
setlocal

set SCRIPT_DIR=%~dp0

echo Starting local Traefik dev environment...
docker compose -f "%SCRIPT_DIR%docker-compose.yml" up -d --pull missing

echo.
echo Dev environment is up:
echo   Traefik dashboard : http://localhost:8080/dashboard/
echo   Traefik API       : http://localhost:8080/api/http/routers
echo   app-alpha         : http://alpha.localhost:8081/
echo   app-beta          : http://beta.localhost:8081/
echo   app-gamma         : http://gamma.localhost:8081/
echo.
echo To stop: docker compose -f "%SCRIPT_DIR%docker-compose.yml" down
