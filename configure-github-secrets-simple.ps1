# Script simplificado para configurar secrets do GitHub
# Usa a API do GitHub com criptografia RSA

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [string]$NetlifyToken = "nfp_zroz2KEKA7JqN6mqUcp15YHS4xWsq1PHb41e",
    [string]$NetlifySiteId = "d54609b4-a942-467b-bb6a-80d032a8587e"
)

$repoOwner = "nardogod"
$repoName = "fincontrol"
$baseUrl = "https://api.github.com"

Write-Host "Configurando secrets do GitHub..." -ForegroundColor Cyan
Write-Host ""

# Headers
$headers = @{
    "Authorization" = "Bearer $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

# Obter chave publica
Write-Host "1. Obtendo chave publica do repositorio..." -ForegroundColor Yellow
try {
    $publicKeyResponse = Invoke-RestMethod -Uri "$baseUrl/repos/$repoOwner/$repoName/actions/secrets/public-key" -Headers $headers -Method Get
    Write-Host "   OK: Chave publica obtida" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   Token invalido ou sem permissoes!" -ForegroundColor Red
    }
    exit 1
}

# Funcao para criptografar usando RSA
function Encrypt-WithPublicKey {
    param(
        [string]$PlainText,
        [string]$PublicKeyBase64
    )
    
    # Carregar biblioteca .NET para RSA
    Add-Type -AssemblyName System.Security
    
    try {
        # Converter chave publica de base64 para bytes
        $publicKeyBytes = [Convert]::FromBase64String($PublicKeyBase64)
        
        # Criar objeto RSA
        $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider(2048)
        $rsa.ImportRSAPublicKey($publicKeyBytes, [ref]$null)
        
        # Converter texto para bytes
        $plainBytes = [System.Text.Encoding]::UTF8.GetBytes($PlainText)
        
        # Criptografar (RSA tem limite de tamanho, mas nossos secrets sao pequenos)
        $encryptedBytes = $rsa.Encrypt($plainBytes, $false)
        
        # Converter para base64
        return [Convert]::ToBase64String($encryptedBytes)
    } catch {
        Write-Host "   ERRO ao criptografar: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Secrets para configurar
$secrets = @(
    @{ Name = "NETLIFY_AUTH_TOKEN"; Value = $NetlifyToken },
    @{ Name = "NETLIFY_SITE_ID"; Value = $NetlifySiteId },
    @{ Name = "NEXT_PUBLIC_SUPABASE_URL"; Value = "https://ncysankyxvwsuwbqmmtj.supabase.co" },
    @{ Name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"; Value = "CONFIGURE_DO_ENV_LOCAL" }
)

Write-Host "2. Configurando secrets..." -ForegroundColor Yellow
Write-Host ""

foreach ($secret in $secrets) {
    Write-Host "   Configurando: $($secret.Name)..." -ForegroundColor Cyan
    
    try {
        # Criptografar o valor
        $encryptedValue = Encrypt-WithPublicKey -PlainText $secret.Value -PublicKeyBase64 $publicKeyResponse.key
        
        if (-not $encryptedValue) {
            Write-Host "     ERRO: Falha ao criptografar" -ForegroundColor Red
            continue
        }
        
        # Criar body
        $body = @{
            encrypted_value = $encryptedValue
            key_id = $publicKeyResponse.key_id
        } | ConvertTo-Json
        
        # Fazer PUT request
        $secretUrl = "$baseUrl/repos/$repoOwner/$repoName/actions/secrets/$($secret.Name)"
        Invoke-RestMethod -Uri $secretUrl -Headers $headers -Method Put -Body $body -ContentType "application/json" | Out-Null
        
        Write-Host "     OK: Configurado com sucesso!" -ForegroundColor Green
        
    } catch {
        Write-Host "     ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Verifique se NEXT_PUBLIC_SUPABASE_ANON_KEY esta correto!" -ForegroundColor Yellow
Write-Host "  Se apareceu 'CONFIGURE_DO_ENV_LOCAL', configure manualmente:" -ForegroundColor Yellow
Write-Host "  https://github.com/nardogod/fincontrol/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para testar:" -ForegroundColor Yellow
Write-Host "  git commit --allow-empty -m 'test: deploy automatico'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
Write-Host ""

