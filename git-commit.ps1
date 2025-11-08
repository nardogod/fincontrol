# Script PowerShell para fazer commit e push no Git
# Uso: .\git-commit.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "Verificando status do Git..." -ForegroundColor Cyan

# Verificar se estamos em um repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "ERRO: Nao e um repositorio Git!" -ForegroundColor Red
    exit 1
}

# Verificar se ha mudancas
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "AVISO: Nenhuma mudanca para commitar!" -ForegroundColor Yellow
    exit 0
}

Write-Host "Mudancas encontradas:" -ForegroundColor Green
git status --short

# Adicionar todos os arquivos (exceto .netlify e arquivos temporarios)
Write-Host ""
Write-Host "Adicionando arquivos ao staging..." -ForegroundColor Cyan

# Adicionar arquivos modificados e novos (mas nao deletar .netlify)
git add -A

# Remover arquivos .netlify do staging (nao devem ser commitados)
git reset -- .netlify/ 2>$null

# Verificar se ha algo para commitar apos remover .netlify
$staged = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "AVISO: Nenhuma mudanca relevante para commitar (apenas arquivos .netlify ignorados)!" -ForegroundColor Yellow
    exit 0
}

Write-Host "OK: Arquivos adicionados ao staging" -ForegroundColor Green

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Cyan
try {
    git commit -m $Message
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Commit realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Erro ao fazer commit!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERRO: Erro ao fazer commit: $_" -ForegroundColor Red
    exit 1
}

# Fazer push
Write-Host ""
Write-Host "Fazendo push para o repositorio remoto..." -ForegroundColor Cyan
try {
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Push realizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "SUCESSO: Git atualizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Erro ao fazer push!" -ForegroundColor Red
        Write-Host "DICA: Tente fazer push manualmente: git push" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERRO: Erro ao fazer push: $_" -ForegroundColor Red
    Write-Host "DICA: Tente fazer push manualmente: git push" -ForegroundColor Yellow
    exit 1
}
