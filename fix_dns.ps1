# Script para adicionar DNS alternativo (Google DNS)
# Execute este script como Administrador

Write-Host "Configurando DNS alternativo..." -ForegroundColor Yellow

# Verificar se esta executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    exit 1
}

# Obter o nome da interface
$interfaceName = "Ethernet"

# Configurar DNS primario (mantem o atual)
netsh interface ip set dns "$interfaceName" static 192.168.7.1 primary

# Adicionar DNS alternativo (Google DNS)
netsh interface ip add dns "$interfaceName" 8.8.8.8 index=2

# Limpar cache DNS
ipconfig /flushdns

Write-Host "DNS configurado com sucesso!" -ForegroundColor Green
Write-Host "DNS Primario: 192.168.7.1" -ForegroundColor Cyan
Write-Host "DNS Alternativo: 8.8.8.8 (Google)" -ForegroundColor Cyan

# Verificar configuracao
Write-Host "`nConfiguracao atual:" -ForegroundColor Yellow
Get-DnsClientServerAddress -InterfaceAlias "$interfaceName"

# Testar resolucao
Write-Host "`nTestando resolucao DNS..." -ForegroundColor Yellow
$result = Resolve-DnsName api.cursor.sh -ErrorAction SilentlyContinue
if ($result) {
    Write-Host "OK: api.cursor.sh resolvido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "AVISO: api.cursor.sh ainda nao resolve (pode nao existir como registro DNS)" -ForegroundColor Yellow
}

Write-Host "`nConcluido!" -ForegroundColor Green
