/**
 * Script para configurar variáveis de ambiente no Netlify
 * 
 * Requer: Netlify CLI instalado (npm install -g netlify-cli)
 * 
 * Uso:
 *   node scripts/setup-netlify-env.js
 * 
 * OU configure manualmente em:
 *   https://app.netlify.com/sites/fincontrol-app/settings/env
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para carregar .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    log("❌ Arquivo .env.local não encontrado!", "red");
    log("💡 Crie o arquivo .env.local na raiz do projeto", "yellow");
    process.exit(1);
  }

  const envFile = fs.readFileSync(envPath, "utf8");
  const envVars = {};

  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

// Verificar se Netlify CLI está instalado
function checkNetlifyCLI() {
  try {
    execSync("netlify --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Configurar variável no Netlify
function setNetlifyEnv(key, value) {
  try {
    log(`🔧 Configurando ${key}...`, "cyan");
    execSync(`netlify env:set ${key} "${value}"`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    log(`✅ ${key} configurado!`, "green");
    return true;
  } catch (error) {
    log(`❌ Erro ao configurar ${key}: ${error.message}`, "red");
    return false;
  }
}

// Lista de variáveis necessárias
const REQUIRED_VARS = [
  "TELEGRAM_BOT_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

async function main() {
  log("\n🚀 Configurando Variáveis de Ambiente no Netlify\n", "blue");
  log("=".repeat(60), "cyan");

  // Verificar Netlify CLI
  if (!checkNetlifyCLI()) {
    log("\n❌ Netlify CLI não está instalado!", "red");
    log("\n💡 Instale com:", "yellow");
    log("   npm install -g netlify-cli", "cyan");
    log("\n💡 OU configure manualmente em:", "yellow");
    log("   https://app.netlify.com/sites/fincontrol-app/settings/env\n", "cyan");
    process.exit(1);
  }

  // Carregar variáveis do .env.local
  log("\n📂 Carregando variáveis do .env.local...", "cyan");
  const envVars = loadEnvFile();

  // Verificar se todas as variáveis estão presentes
  const missing = REQUIRED_VARS.filter((key) => !envVars[key]);
  if (missing.length > 0) {
    log("\n❌ Variáveis faltando no .env.local:", "red");
    missing.forEach((key) => log(`   - ${key}`, "yellow"));
    log("\n💡 Adicione essas variáveis ao .env.local e tente novamente\n", "yellow");
    process.exit(1);
  }

  log("✅ Todas as variáveis encontradas no .env.local\n", "green");

  // Verificar se está logado no Netlify
  try {
    execSync("netlify status", { stdio: "ignore" });
  } catch (error) {
    log("\n⚠️  Você precisa estar logado no Netlify CLI", "yellow");
    log("💡 Execute: netlify login\n", "cyan");
    process.exit(1);
  }

  // Configurar cada variável
  log("📝 Configurando variáveis no Netlify...\n", "cyan");
  let successCount = 0;

  for (const key of REQUIRED_VARS) {
    const value = envVars[key];
    
    // Mascarar valores sensíveis no log
    const maskedValue = key.includes("TOKEN") || key.includes("KEY")
      ? `${value.substring(0, 10)}...`
      : value;
    
    log(`\n${key} = ${maskedValue}`, "blue");
    
    if (setNetlifyEnv(key, value)) {
      successCount++;
    }
  }

  log("\n" + "=".repeat(60), "cyan");
  
  if (successCount === REQUIRED_VARS.length) {
    log("\n✅ Todas as variáveis foram configuradas com sucesso!", "green");
    log("\n📋 Próximos passos:", "blue");
    log("   1. npm run webhook:prod - Configurar webhook do Telegram", "cyan");
    log("   2. npm run deploy - Fazer deploy da aplicação", "cyan");
    log("   3. npm run webhook:check - Verificar se webhook está funcionando", "cyan");
  } else {
    log(`\n⚠️  ${successCount}/${REQUIRED_VARS.length} variáveis configuradas`, "yellow");
    log("💡 Configure manualmente as variáveis faltantes em:", "yellow");
    log("   https://app.netlify.com/sites/fincontrol-app/settings/env\n", "cyan");
  }
}

main().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, "red");
  process.exit(1);
});

