# Script para fazer rollback de deploy no Netlify
# Uso: .\rollback-deploy.ps1

Write-Host "Listando deploys recentes..." -ForegroundColor Cyan
Write-Host ""

# Listar últimos 10 deploys
netlify deploy:list --json | ConvertFrom-Json | Select-Object -First 10 | ForEach-Object {
    Write-Host "Deploy ID: $($_.id)" -ForegroundColor Yellow
    Write-Host "  State: $($_.state)" -ForegroundColor $(if ($_.state -eq "ready") { "Green" } else { "Red" })
    Write-Host "  Created: $($_.created_at)" -ForegroundColor White
    Write-Host "  URL: $($_.deploy_url)" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Para fazer rollback, execute:" -ForegroundColor Yellow
Write-Host "  netlify deploy:rollback --prod" -ForegroundColor White
Write-Host ""
Write-Host "Ou especifique um deploy ID:" -ForegroundColor Yellow
Write-Host "  netlify deploy:rollback --prod --deploy-id=SEU_DEPLOY_ID" -ForegroundColor White
Write-Host ""

