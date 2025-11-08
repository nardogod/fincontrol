# Script PowerShell para fazer deploy no Netlify (sem Git)
# Uso: .\deploy-only.ps1

Write-Host "Iniciando deploy manual via Netlify CLI..." -ForegroundColor Cyan
Write-Host "REGRA DO PROJETO: Deploy SEMPRE manual via terminal do Cursor" -ForegroundColor Yellow
Write-Host "NAO ha deploy automatico neste projeto" -ForegroundColor Yellow
Write-Host ""

# Verificar se Netlify CLI esta instalado
Write-Host "Verificando Netlify CLI..." -ForegroundColor Cyan
try {
    $null = netlify --version 2>&1
    Write-Host "OK: Netlify CLI encontrado" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERRO: Netlify CLI nao encontrado!" -ForegroundColor Red
    Write-Host "Instalando Netlify CLI globalmente..." -ForegroundColor Cyan
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Erro ao instalar Netlify CLI!" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Netlify CLI instalado" -ForegroundColor Green
    Write-Host ""
}

# Limpar builds anteriores
Write-Host "Limpando builds anteriores..." -ForegroundColor Cyan
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Host "OK: Limpeza concluida" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "AVISO: Nao foi possivel limpar .next completamente (continuando mesmo assim)" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "OK: Nenhum build anterior encontrado" -ForegroundColor Green
    Write-Host ""
}

if (Test-Path "out") {
    try {
        Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
    } catch {
        # Ignorar erros
    }
}

# Verificar dependencias
Write-Host "Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Host "AVISO: npm ci falhou, tentando npm install..." -ForegroundColor Yellow
            npm install
        }
        Write-Host "OK: Dependencias instaladas" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "ERRO: Erro ao instalar dependencias!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: Dependencias ja instaladas" -ForegroundColor Green
    Write-Host ""
}

# Fazer build
Write-Host "Fazendo build de producao..." -ForegroundColor Cyan
Write-Host "AVISO: Se o build travar, pressione Ctrl+C e tente novamente apos fechar processos Node.js" -ForegroundColor Yellow
Write-Host ""

try {
    $nextPath = Join-Path $PSScriptRoot "node_modules\.bin\next.cmd"
    if (Test-Path $nextPath) {
        & $nextPath build
    } else {
        npm run build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Erro durante o build!" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path ".next")) {
        Write-Host "ERRO: Diretorio .next nao foi criado!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "OK: Build concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERRO: Erro durante o build: $_" -ForegroundColor Red
    exit 1
}

# Fazer deploy no Netlify
Write-Host "Fazendo deploy no Netlify..." -ForegroundColor Cyan
Write-Host "Site: fincontrol-app" -ForegroundColor Cyan
Write-Host "AVISO: O Netlify vai processar o build com o plugin Next.js" -ForegroundColor Yellow
Write-Host ""

try {
    $deployOutput = netlify deploy --prod 2>&1 | Out-String
    
    Write-Host $deployOutput
    
    # Extrair URL do deploy
    if ($deployOutput -match "Deployed to production URL:\s+(https?://[^\s]+)") {
        $productionUrl = $matches[1]
        Write-Host ""
        Write-Host "SUCESSO: Deploy concluido com sucesso!" -ForegroundColor Green
        Write-Host "URL de producao: $productionUrl" -ForegroundColor Cyan
    } elseif ($deployOutput -match "Unique deploy URL:\s+(https?://[^\s]+)") {
        $uniqueUrl = $matches[1]
        Write-Host ""
        Write-Host "SUCESSO: Deploy concluido com sucesso!" -ForegroundColor Green
        Write-Host "URL unica do deploy: $uniqueUrl" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "OK: Deploy concluido!" -ForegroundColor Green
        Write-Host "Verifique o status em: https://app.netlify.com/sites/fincontrol-app" -ForegroundColor Cyan
    }
} catch {
    Write-Host ""
    Write-Host "ERRO: Erro durante o deploy: $_" -ForegroundColor Red
    exit 1
}
