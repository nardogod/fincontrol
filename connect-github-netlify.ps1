# Script para conectar GitHub ao Netlify via API
Write-Host "Conectando repositorio GitHub ao Netlify..." -ForegroundColor Cyan
Write-Host ""

# Obter token do Netlify
Write-Host "Obtendo token do Netlify..." -ForegroundColor Yellow
$token = netlify status 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Nao foi possivel obter informacoes do Netlify" -ForegroundColor Red
    exit 1
}

# Verificar se o usuario esta logado
$loggedIn = netlify status 2>&1 | Select-String -Pattern "nardogomes.lg@gmail.com"
if (-not $loggedIn) {
    Write-Host "ERRO: Voce nao esta logado no Netlify CLI" -ForegroundColor Red
    Write-Host "Execute: netlify login" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Usuario logado" -ForegroundColor Green
Write-Host ""

# Informacoes do site
$siteId = "d54609b4-a942-467b-bb6a-80d032a8587e"
$repo = "nardogod/fincontrol"
$branch = "main"
$buildCmd = "npm run build"
$publishDir = ".next"

Write-Host "Configuracoes:" -ForegroundColor Cyan
Write-Host "  Site ID: $siteId" -ForegroundColor White
Write-Host "  Repositorio: $repo" -ForegroundColor White
Write-Host "  Branch: $branch" -ForegroundColor White
Write-Host "  Build Command: $buildCmd" -ForegroundColor White
Write-Host "  Publish Dir: $publishDir" -ForegroundColor White
Write-Host ""

Write-Host "ATENCAO:" -ForegroundColor Yellow
Write-Host "  A conexao do repositorio Git ao Netlify so pode ser feita via Dashboard Web" -ForegroundColor Yellow
Write-Host "  A API do Netlify nao oferece endpoint para conectar repositorios" -ForegroundColor Yellow
Write-Host ""
Write-Host "Por favor, siga estes passos:" -ForegroundColor Cyan
Write-Host "  1. Abra: https://app.netlify.com/sites/fincontrol-app/settings/deploys" -ForegroundColor White
Write-Host "  2. Na secao Build & deploy > Continuous deployment" -ForegroundColor White
Write-Host "  3. Clique em Link site to Git" -ForegroundColor White
Write-Host "  4. Escolha GitHub e autorize" -ForegroundColor White
Write-Host "  5. Selecione o repositorio: nardogod/fincontrol" -ForegroundColor White
Write-Host "  6. Configure:" -ForegroundColor White
Write-Host "     - Branch to deploy: main" -ForegroundColor White
Write-Host "     - Build command: npm run build" -ForegroundColor White
Write-Host "     - Publish directory: .next" -ForegroundColor White
Write-Host "  7. Clique em Deploy site" -ForegroundColor White
Write-Host ""
Write-Host "Abrindo dashboard do Netlify..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
netlify open:admin
Write-Host ""
Write-Host "Navegue ate: Site settings > Build & deploy" -ForegroundColor Yellow
Write-Host ""

