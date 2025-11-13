# Script PowerShell para configurar variáveis de ambiente no Netlify
# 
# Requer: Netlify CLI instalado (npm install -g netlify-cli)
# 
# Uso:
#   .\scripts\setup-netlify-env.ps1

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Função para carregar .env.local
function Load-EnvFile {
    $envPath = Join-Path $PSScriptRoot ".." ".env.local"
    
    if (-not (Test-Path $envPath)) {
        Write-ColorOutput "❌ Arquivo .env.local não encontrado!" "Red"
        Write-ColorOutput "💡 Crie o arquivo .env.local na raiz do projeto" "Yellow"
        exit 1
    }
    
    $envVars = @{}
    $content = Get-Content $envPath
    
    foreach ($line in $content) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#")) {
            if ($trimmed -match "^([^=]+)=(.*)$") {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
                $envVars[$key] = $value
            }
        }
    }
    
    return $envVars
}

# Verificar se Netlify CLI está instalado
function Test-NetlifyCLI {
    try {
        $null = netlify --version 2>&1
        return $true
    } catch {
        return $false
    }
}

# Configurar variável no Netlify
function Set-NetlifyEnv {
    param(
        [string]$Key,
        [string]$Value
    )
    
    try {
        Write-ColorOutput "🔧 Configurando $Key..." "Cyan"
        $output = netlify env:set $Key "`"$Value`"" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ $Key configurado!" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Erro ao configurar $Key" "Red"
            Write-ColorOutput $output "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Erro ao configurar $Key : $_" "Red"
        return $false
    }
}

# Lista de variáveis necessárias
$REQUIRED_VARS = @(
    "TELEGRAM_BOT_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL"
)

# Main
Write-ColorOutput "`n🚀 Configurando Variáveis de Ambiente no Netlify`n" "Blue"
Write-ColorOutput ("=" * 60) "Cyan"

# Verificar Netlify CLI
if (-not (Test-NetlifyCLI)) {
    Write-ColorOutput "`n❌ Netlify CLI não está instalado!" "Red"
    Write-ColorOutput "`n💡 Instale com:" "Yellow"
    Write-ColorOutput "   npm install -g netlify-cli" "Cyan"
    Write-ColorOutput "`n💡 OU configure manualmente em:" "Yellow"
    Write-ColorOutput "   https://app.netlify.com/sites/fincontrol-app/settings/env`n" "Cyan"
    exit 1
}

# Carregar variáveis do .env.local
Write-ColorOutput "`n📂 Carregando variáveis do .env.local..." "Cyan"
$envVars = Load-EnvFile

# Verificar se todas as variáveis estão presentes
$missing = $REQUIRED_VARS | Where-Object { -not $envVars.ContainsKey($_) }
if ($missing.Count -gt 0) {
    Write-ColorOutput "`n❌ Variáveis faltando no .env.local:" "Red"
    foreach ($key in $missing) {
        Write-ColorOutput "   - $key" "Yellow"
    }
    Write-ColorOutput "`n💡 Adicione essas variáveis ao .env.local e tente novamente`n" "Yellow"
    exit 1
}

Write-ColorOutput "✅ Todas as variáveis encontradas no .env.local`n" "Green"

# Verificar se está logado no Netlify
try {
    $null = netlify status 2>&1
} catch {
    Write-ColorOutput "`n⚠️  Você precisa estar logado no Netlify CLI" "Yellow"
    Write-ColorOutput "💡 Execute: netlify login`n" "Cyan"
    exit 1
}

# Configurar cada variável
Write-ColorOutput "📝 Configurando variáveis no Netlify...`n" "Cyan"
$successCount = 0

foreach ($key in $REQUIRED_VARS) {
    $value = $envVars[$key]
    
    # Mascarar valores sensíveis no log
    if ($key -match "TOKEN|KEY") {
        $maskedValue = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
    } else {
        $maskedValue = $value
    }
    
    Write-ColorOutput "`n$key = $maskedValue" "Blue"
    
    if (Set-NetlifyEnv -Key $key -Value $value) {
        $successCount++
    }
}

Write-ColorOutput "`n" + ("=" * 60) "Cyan"

if ($successCount -eq $REQUIRED_VARS.Count) {
    Write-ColorOutput "`n✅ Todas as variáveis foram configuradas com sucesso!" "Green"
    Write-ColorOutput "`n📋 Próximos passos:" "Blue"
    Write-ColorOutput "   1. npm run webhook:prod - Configurar webhook do Telegram" "Cyan"
    Write-ColorOutput "   2. npm run deploy - Fazer deploy da aplicação" "Cyan"
    Write-ColorOutput "   3. npm run webhook:check - Verificar se webhook está funcionando" "Cyan"
} else {
    Write-ColorOutput "`n⚠️  $successCount/$($REQUIRED_VARS.Count) variáveis configuradas" "Yellow"
    Write-ColorOutput "💡 Configure manualmente as variáveis faltantes em:" "Yellow"
    Write-ColorOutput "   https://app.netlify.com/sites/fincontrol-app/settings/env`n" "Cyan"
}

