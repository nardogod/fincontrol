/**
 * Script para verificar status do webhook do Telegram
 * 
 * Uso:
 *   node scripts/check-telegram-webhook.js
 */

const fs = require("fs");
const path = require("path");

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
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  log("❌ TELEGRAM_BOT_TOKEN não configurado!", "red");
  log("💡 Configure no .env.local ou como variável de ambiente\n", "yellow");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function getWebhookInfo() {
  log("\n📊 Verificando status do webhook...\n", "cyan");

  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      
      log("=".repeat(60), "blue");
      log("📋 Status do Webhook do Telegram", "blue");
      log("=".repeat(60), "blue");
      
      if (info.url) {
        log(`\n✅ URL: ${info.url}`, "green");
        
        // Verificar se URL está correta
        const expectedUrl = "https://fincontrol-app.netlify.app/api/telegram/webhook";
        if (info.url === expectedUrl) {
          log("✅ URL está correta!", "green");
        } else {
          log(`⚠️  URL esperada: ${expectedUrl}`, "yellow");
          log("💡 Execute: npm run webhook:prod", "cyan");
        }
      } else {
        log("\n❌ Webhook não configurado", "red");
        log("💡 Execute: npm run webhook:prod", "yellow");
      }
      
      log(`\n📊 Pendentes: ${info.pending_update_count || 0}`, "cyan");
      
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toLocaleString("pt-BR");
        log(`\n⚠️  Último erro em: ${errorDate}`, "yellow");
        log(`   Mensagem: ${info.last_error_message}`, "yellow");
      } else {
        log("\n✅ Nenhum erro recente", "green");
      }
      
      if (info.max_connections) {
        log(`\n🔗 Conexões máximas: ${info.max_connections}`, "cyan");
      }
      
      log("\n" + "=".repeat(60), "blue");
      
      return info;
    } else {
      log(`❌ Erro ao verificar webhook: ${result.description}`, "red");
      return null;
    }
  } catch (error) {
    log(`❌ Erro ao verificar webhook: ${error.message}`, "red");
    return null;
  }
}

async function getBotInfo() {
  log("\n🤖 Informações do Bot\n", "cyan");

  try {
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const result = await response.json();

    if (result.ok) {
      const bot = result.result;
      log("=".repeat(60), "blue");
      log("🤖 Informações do Bot", "blue");
      log("=".repeat(60), "blue");
      log(`\n📛 Nome: ${bot.first_name}`, "green");
      log(`👤 Username: @${bot.username}`, "green");
      log(`🆔 ID: ${bot.id}`, "cyan");
      log(`🔗 Link: https://t.me/${bot.username}`, "blue");
      log("\n" + "=".repeat(60), "blue");
    }
  } catch (error) {
    log(`❌ Erro ao buscar informações do bot: ${error.message}`, "red");
  }
}

async function main() {
  log("\n🚀 Verificação do Webhook do Telegram\n", "blue");
  
  await getBotInfo();
  await getWebhookInfo();
  
  log("\n💡 Comandos úteis:", "blue");
  log("   npm run webhook:prod - Configurar webhook para produção", "cyan");
  log("   npm run webhook:check - Verificar status novamente", "cyan");
  log("   npm run telegram:test - Testar conexão do bot\n", "cyan");
}

main().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, "red");
  process.exit(1);
});

