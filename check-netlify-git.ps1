# Script para verificar e configurar Git no Netlify
Write-Host "Verificando configuracao Git no Netlify..." -ForegroundColor Cyan
Write-Host ""

# Informacoes do repositorio
Write-Host "Repositorio Git Local:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Ultimos commits
Write-Host "Ultimos 5 commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTICO:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repositorio Git:" -ForegroundColor White
Write-Host "  Local: https://github.com/nardogod/fincontrol.git" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "  O Netlify NAO esta conectado ao repositorio Git!" -ForegroundColor Red
Write-Host "  Por isso nao faz deploy automatico quando voce faz push." -ForegroundColor Red
Write-Host ""
Write-Host "SOLUCAO:" -ForegroundColor Yellow
Write-Host "  1. Acesse: https://app.netlify.com/sites/fincontrol-app/settings/deploys" -ForegroundColor White
Write-Host "  2. Na secao Build & deploy, clique em Link site to Git" -ForegroundColor White
Write-Host "  3. Escolha GitHub e autorize" -ForegroundColor White
Write-Host "  4. Selecione o repositorio: nardogod/fincontrol" -ForegroundColor White
Write-Host "  5. Configure:" -ForegroundColor White
Write-Host "     - Branch: main" -ForegroundColor White
Write-Host "     - Build command: npm run build" -ForegroundColor White
Write-Host "     - Publish directory: .next" -ForegroundColor White
Write-Host "  6. Salve as configuracoes" -ForegroundColor White
Write-Host ""
