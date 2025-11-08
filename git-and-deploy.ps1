# Script PowerShell para fazer Git (commit + push) e depois Deploy
# Uso: .\git-and-deploy.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "Iniciando processo completo: Git + Deploy" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Git
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PASSO 1: GIT (COMMIT + PUSH)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& "$PSScriptRoot\git-commit.ps1" -Message $Message

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: Erro no Git! Abortando deploy." -ForegroundColor Red
    exit 1
}

# Passo 2: Deploy
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PASSO 2: DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& "$PSScriptRoot\deploy-only.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: Erro no Deploy!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCESSO: Processo completo finalizado com sucesso!" -ForegroundColor Green
