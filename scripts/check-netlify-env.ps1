# Script PowerShell para verificar variaveis de ambiente no Netlify
# Requer: Netlify CLI instalado (npm install -g netlify-cli)
# Uso: .\scripts\check-netlify-env.ps1

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "Verificando variaveis de ambiente no Netlify..." "Blue"
Write-Host ""

# Lista de variaveis necessarias
$REQUIRED_VARS = @(
    "TELEGRAM_BOT_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL"
)

$OPTIONAL_VARS = @(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Verificar se Netlify CLI esta instalado
try {
    $null = netlify --version 2>&1
} catch {
    Write-ColorOutput "ERRO: Netlify CLI nao esta instalado!" "Red"
    Write-ColorOutput "Instale com: npm install -g netlify-cli" "Yellow"
    exit 1
}

# Verificar se esta logado no Netlify
try {
    $null = netlify status 2>&1
} catch {
    Write-ColorOutput "AVISO: Voce precisa estar logado no Netlify CLI" "Yellow"
    Write-ColorOutput "Execute: netlify login" "Cyan"
    exit 1
}

Write-ColorOutput "Variaveis Obrigatorias:" "Blue"
Write-Host ""

$missingCount = 0
$foundCount = 0

foreach ($var in $REQUIRED_VARS) {
    Write-Host -NoNewline "   $var`: "
    
    try {
        $output = netlify env:get $var 2>&1
        $value = $output | Out-String
        $value = $value.Trim()
        
        if ($value -and -not $value.Contains("Error") -and $value.Length -gt 0) {
            # Mascarar valores sensiveis
            if ($var -match "TOKEN|KEY") {
                $len = [Math]::Min(10, $value.Length)
                $maskedValue = $value.Substring(0, $len) + "..."
                Write-ColorOutput "OK Configurado ($maskedValue)" "Green"
            } else {
                Write-ColorOutput "OK Configurado ($value)" "Green"
            }
            $foundCount++
        } else {
            Write-ColorOutput "ERRO: Nao configurado" "Red"
            $missingCount++
        }
    } catch {
        Write-ColorOutput "ERRO: Nao configurado" "Red"
        $missingCount++
    }
}

Write-Host ""
Write-ColorOutput "Variaveis Opcionais:" "Blue"
Write-Host ""

foreach ($var in $OPTIONAL_VARS) {
    Write-Host -NoNewline "   $var`: "
    
    try {
        $output = netlify env:get $var 2>&1
        $value = $output | Out-String
        $value = $value.Trim()
        
        if ($value -and -not $value.Contains("Error") -and $value.Length -gt 0) {
            if ($var -match "KEY") {
                $len = [Math]::Min(10, $value.Length)
                $maskedValue = $value.Substring(0, $len) + "..."
                Write-ColorOutput "OK Configurado ($maskedValue)" "Green"
            } else {
                Write-ColorOutput "OK Configurado ($value)" "Green"
            }
        } else {
            Write-ColorOutput "AVISO: Nao configurado (opcional)" "Yellow"
        }
    } catch {
        Write-ColorOutput "AVISO: Nao configurado (opcional)" "Yellow"
    }
}

Write-Host ""
Write-Host ("=" * 60)
Write-Host ""

if ($missingCount -eq 0) {
    Write-ColorOutput "OK Todas as variaveis obrigatorias estao configuradas!" "Green"
    Write-Host ""
    Write-ColorOutput "Proximos passos:" "Cyan"
    Write-ColorOutput "   1. npm run webhook:prod - Configurar webhook do Telegram" "Cyan"
    Write-ColorOutput "   2. npm run deploy - Fazer deploy da aplicacao" "Cyan"
    Write-ColorOutput "   3. npm run webhook:check - Verificar se webhook esta funcionando" "Cyan"
    exit 0
} else {
    Write-ColorOutput "ERRO: $missingCount variavel(is) obrigatoria(s) faltando!" "Red"
    Write-Host ""
    Write-ColorOutput "Configure as variaveis faltantes em:" "Yellow"
    Write-ColorOutput "   https://app.netlify.com/sites/fincontrol-app/settings/env" "Cyan"
    Write-Host ""
    Write-ColorOutput "OU use o script:" "Cyan"
    Write-ColorOutput "   npm run setup:netlify" "Cyan"
    exit 1
}
