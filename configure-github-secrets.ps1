# Script para configurar secrets do GitHub via API
# Requer: GitHub Personal Access Token com permissao repo

param(
    [string]$GitHubToken = "",
    [string]$NetlifyToken = "nfp_zroz2KEKA7JqN6mqUcp15YHS4xWsq1PHb41e",
    [string]$NetlifySiteId = "d54609b4-a942-467b-bb6a-80d032a8587e"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao de Secrets do GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se GitHub Token foi fornecido
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host "ERRO: GitHub Token nao fornecido!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para configurar os secrets automaticamente, voce precisa:" -ForegroundColor Yellow
    Write-Host "  1. Criar um Personal Access Token no GitHub:" -ForegroundColor White
    Write-Host "     https://github.com/settings/tokens/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Permissoes necessarias:" -ForegroundColor White
    Write-Host "     - repo (Full control of private repositories)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  3. Execute novamente:" -ForegroundColor White
    Write-Host "     .\configure-github-secrets.ps1 -GitHubToken SEU_TOKEN_AQUI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OU configure manualmente:" -ForegroundColor Yellow
    Write-Host "  https://github.com/nardogod/fincontrol/settings/secrets/actions" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

$repoOwner = "nardogod"
$repoName = "fincontrol"
$baseUrl = "https://api.github.com"

# Headers para API do GitHub
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell-Script"
}

# Funcao para obter chave publica do repositorio
function Get-RepoPublicKey {
    Write-Host "Obtendo chave publica do repositorio..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/repos/$repoOwner/$repoName/actions/secrets/public-key" -Headers $headers -Method Get
        return $response
    } catch {
        Write-Host "ERRO ao obter chave publica: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "Token invalido ou sem permissoes!" -ForegroundColor Red
        }
        throw
    }
}

# Funcao para criptografar secret usando chave publica
function Encrypt-Secret {
    param(
        [string]$Secret,
        [string]$PublicKey,
        [string]$KeyId
    )
    
    # Para criptografar, precisamos usar a biblioteca .NET
    # Mas a API do GitHub aceita o valor criptografado em base64
    # Vamos usar uma abordagem mais simples: usar curl ou fazer via API
    
    # Por enquanto, vamos usar a biblioteca System.Security.Cryptography
    Add-Type -AssemblyName System.Security
    
    # Converter chave publica de base64 para bytes
    $publicKeyBytes = [Convert]::FromBase64String($PublicKey)
    
    # Criar objeto RSA
    $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider
    $rsa.ImportRSAPublicKey($publicKeyBytes, [ref]$null)
    
    # Criptografar o secret
    $secretBytes = [System.Text.Encoding]::UTF8.GetBytes($Secret)
    $encryptedBytes = $rsa.Encrypt($secretBytes, $false)
    
    # Converter para base64
    $encryptedBase64 = [Convert]::ToBase64String($encryptedBytes)
    
    return $encryptedBase64
}

# Obter chave publica
Write-Host "Obtendo chave publica do repositorio..." -ForegroundColor Yellow
$publicKeyInfo = Get-RepoPublicKey
Write-Host "OK: Chave publica obtida (Key ID: $($publicKeyInfo.key_id))" -ForegroundColor Green
Write-Host ""

# Ler variaveis do .env.local
$supabaseUrl = ""
$supabaseKey = ""

if (Test-Path ".env.local") {
    Write-Host "Lendo variaveis do .env.local..." -ForegroundColor Yellow
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.*)") {
            $supabaseUrl = $matches[1].Trim()
        }
        if ($line -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)") {
            $supabaseKey = $matches[1].Trim()
        }
    }
    
    if ($supabaseUrl -and $supabaseKey) {
        Write-Host "OK: Variaveis encontradas no .env.local" -ForegroundColor Green
    } else {
        Write-Host "AVISO: Algumas variaveis nao foram encontradas no .env.local" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "AVISO: Arquivo .env.local nao encontrado" -ForegroundColor Yellow
    Write-Host ""
}

# Secrets para configurar
$secrets = @(
    @{
        Name = "NETLIFY_AUTH_TOKEN"
        Value = $NetlifyToken
    },
    @{
        Name = "NETLIFY_SITE_ID"
        Value = $NetlifySiteId
    },
    @{
        Name = "NEXT_PUBLIC_SUPABASE_URL"
        Value = if ($supabaseUrl) { $supabaseUrl } else { "https://ncysankyxvwsuwbqmmtj.supabase.co" }
    },
    @{
        Name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        Value = if ($supabaseKey) { $supabaseKey } else { "CONFIGURE_MANUALMENTE" }
    }
)

# Configurar cada secret
Write-Host "Configurando secrets..." -ForegroundColor Cyan
Write-Host ""

foreach ($secret in $secrets) {
    Write-Host "Configurando: $($secret.Name)..." -ForegroundColor Yellow
    
    try {
        # Criptografar o secret
        $encryptedValue = Encrypt-Secret -Secret $secret.Value -PublicKey $publicKeyInfo.key -KeyId $publicKeyInfo.key_id
        
        # Criar body da requisicao
        $body = @{
            encrypted_value = $encryptedValue
            key_id = $publicKeyInfo.key_id
        } | ConvertTo-Json
        
        # Fazer PUT request
        $secretUrl = "$baseUrl/repos/$repoOwner/$repoName/actions/secrets/$($secret.Name)"
        Invoke-RestMethod -Uri $secretUrl -Headers $headers -Method Put -Body $body -ContentType "application/json" | Out-Null
        
        Write-Host "  OK: $($secret.Name) configurado com sucesso!" -ForegroundColor Green
        
    } catch {
        Write-Host "  ERRO ao configurar $($secret.Name): $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  Token sem permissoes adequadas!" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifique os secrets em:" -ForegroundColor Yellow
Write-Host "  https://github.com/nardogod/fincontrol/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para testar o deploy automatico:" -ForegroundColor Yellow
Write-Host "  git commit --allow-empty -m 'test: deploy automatico'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
Write-Host ""

