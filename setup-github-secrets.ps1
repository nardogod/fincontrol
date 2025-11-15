# Script para configurar secrets do GitHub para deploy automatico
Write-Host "Configurando secrets do GitHub..." -ForegroundColor Cyan
Write-Host ""

# NETLIFY_SITE_ID
$siteId = "d54609b4-a942-467b-bb6a-80d032a8587e"

# Obter informacoes do .env.local
$envPath = ".env.local"
$supabaseUrl = ""
$supabaseKey = ""

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    foreach ($line in $envContent) {
        if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.*)") {
            $supabaseUrl = $matches[1]
        }
        if ($line -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)") {
            $supabaseKey = $matches[1]
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACAO DE SECRETS DO GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ativar o deploy automatico, voce precisa:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Obter seu Netlify Auth Token:" -ForegroundColor White
Write-Host "   Execute: netlify status" -ForegroundColor Yellow
Write-Host "   (O token esta armazenado internamente pelo Netlify CLI)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Para obter um novo token de acesso:" -ForegroundColor White
Write-Host "   - Acesse: https://app.netlify.com/user/applications#personal-access-tokens" -ForegroundColor Yellow
Write-Host "   - Clique em 'New access token'" -ForegroundColor Yellow
Write-Host "   - De um nome (ex: GitHub Actions)" -ForegroundColor Yellow
Write-Host "   - Copie o token gerado" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Adicionar secrets no GitHub:" -ForegroundColor White
Write-Host "   Acesse: https://github.com/nardogod/fincontrol/settings/secrets/actions" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Clique em 'New repository secret' para cada um:" -ForegroundColor White
Write-Host ""
Write-Host "   Nome: NETLIFY_AUTH_TOKEN" -ForegroundColor Cyan
Write-Host "   Valor: (cole o token que voce obteve acima)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Nome: NETLIFY_SITE_ID" -ForegroundColor Cyan
Write-Host "   Valor: $siteId" -ForegroundColor Yellow
Write-Host ""

if ($supabaseUrl -and $supabaseKey) {
    Write-Host "   Nome: NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "   Valor: $supabaseUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Cyan
    Write-Host "   Valor: $supabaseKey" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "   Nome: NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "   Valor: (copie do seu .env.local)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Cyan
    Write-Host "   Valor: (copie do seu .env.local)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APOS CONFIGURAR OS SECRETS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Execute os seguintes comandos:" -ForegroundColor White
Write-Host "  git add .github/workflows/deploy.yml" -ForegroundColor Yellow
Write-Host "  git commit -m 'ci: adicionar deploy automatico via GitHub Actions'" -ForegroundColor Yellow
Write-Host "  git push" -ForegroundColor Yellow
Write-Host ""
Write-Host "Apos o push, a GitHub Action sera acionada e fara o deploy automaticamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Abrindo paginas necessarias..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "https://app.netlify.com/user/applications#personal-access-tokens"
Start-Sleep -Seconds 1
Start-Process "https://github.com/nardogod/fincontrol/settings/secrets/actions"
Write-Host ""
Write-Host "OK: Paginas abertas no navegador!" -ForegroundColor Green
Write-Host ""
