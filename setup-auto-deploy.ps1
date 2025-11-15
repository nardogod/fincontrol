# Script para configurar deploy automatico via Build Hook e GitHub Actions
Write-Host "Configurando deploy automatico..." -ForegroundColor Cyan
Write-Host ""

$siteId = "d54609b4-a942-467b-bb6a-80d032a8587e"

# Criar Build Hook
Write-Host "Criando Build Hook no Netlify..." -ForegroundColor Yellow

$buildHookData = @"
{
  "site_id": "$siteId",
  "body": {
    "title": "Deploy via GitHub Push",
    "branch": "main"
  }
}
"@

$buildHookData | Out-File -FilePath "build-hook-data.json" -Encoding utf8

try {
    $result = netlify api createSiteBuildHook --data $buildHookData 2>&1 | Out-String
    
    if ($result -match '"url":\s*"([^"]+)"') {
        $webhookUrl = $matches[1]
        Write-Host "OK: Build Hook criado!" -ForegroundColor Green
        Write-Host "URL: $webhookUrl" -ForegroundColor Cyan
        Write-Host ""
        
        # Criar GitHub Action
        Write-Host "Criando GitHub Action..." -ForegroundColor Yellow
        
        $githubActionDir = ".github\workflows"
        if (-not (Test-Path $githubActionDir)) {
            New-Item -ItemType Directory -Path $githubActionDir -Force | Out-Null
        }
        
        $actionContent = @"
name: Deploy to Netlify
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Deploy
        run: curl -X POST -d {} $webhookUrl
"@
        
        $actionContent | Out-File -FilePath "$githubActionDir\deploy-netlify.yml" -Encoding utf8
        
        Write-Host "OK: GitHub Action criada em .github/workflows/deploy-netlify.yml" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Fazer commit da GitHub Action:" -ForegroundColor White
        Write-Host "     git add .github/workflows/deploy-netlify.yml" -ForegroundColor Yellow
        Write-Host "     git commit -m 'ci: adicionar deploy automatico via GitHub Actions'" -ForegroundColor Yellow
        Write-Host "     git push" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  2. A partir do proximo push, o deploy sera automatico!" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "ERRO: Nao foi possivel criar Build Hook" -ForegroundColor Red
        Write-Host "Resposta: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Limpar arquivo temporario
if (Test-Path "build-hook-data.json") {
    Remove-Item "build-hook-data.json" -Force
}

