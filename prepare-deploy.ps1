# Script para preparar arquivos para deploy manual via Dashboard Netlify
Write-Host "Preparando arquivos para deploy manual..." -ForegroundColor Cyan

# Garantir que o build esta feito
if (-not (Test-Path ".next")) {
    Write-Host "Fazendo build..." -ForegroundColor Yellow
    npm run build
}

Write-Host ""
Write-Host "OK: Arquivos preparados!" -ForegroundColor Green
Write-Host ""
Write-Host "Para fazer deploy manual:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://app.netlify.com/sites/fincontrol-app/deploys" -ForegroundColor White
Write-Host "2. Arraste a pasta .next na area de upload" -ForegroundColor White
Write-Host ""
