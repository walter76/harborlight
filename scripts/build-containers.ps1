$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent

Write-Host "Building harborlight-backend..." -ForegroundColor Cyan
docker build -t harborlight-backend "$root\src\harborlight-backend"

Write-Host "Building harborlight-app..." -ForegroundColor Cyan
docker build -t harborlight-app "$root\src\harborlight-app"

Write-Host "Done." -ForegroundColor Green
