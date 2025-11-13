/**
 * Script para configurar webhook do Telegram para produção
 * 
 * Requer: TELEGRAM_BOT_TOKEN no .env.local ou variável de ambiente
 * 
 * Uso:
 *   node scripts/set-telegram-webhook.js
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
// Sempre usar a URL correta de produção
const WEBHOOK_URL = "https://fincontrol-app.netlify.app/api/telegram/webhook";

if (!TELEGRAM_BOT_TOKEN) {
  log("❌ TELEGRAM_BOT_TOKEN não configurado!", "red");
  log("💡 Configure no .env.local ou como variável de ambiente\n", "yellow");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function deleteWebhook() {
  log("\n🗑️  Removendo webhook antigo...", "cyan");
  
  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: true }),
    });

    const result = await response.json();
    
    if (result.ok) {
      log("✅ Webhook antigo removido", "green");
    } else {
      log(`⚠️  Aviso ao remover webhook: ${result.description}`, "yellow");
    }
  } catch (error) {
    log(`⚠️  Erro ao remover webhook: ${error.message}`, "yellow");
  }
}

async function setWebhook() {
  log("\n🔧 Configurando webhook para produção...", "cyan");
  log(`📍 URL: ${WEBHOOK_URL}`, "blue");

  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: WEBHOOK_URL,
        drop_pending_updates: true 
      }),
    });

    const result = await response.json();

    if (result.ok) {
      log("✅ Webhook configurado com sucesso!", "green");
      return true;
    } else {
      log(`❌ Erro ao configurar webhook: ${result.description}`, "red");
      if (result.error_code === 400) {
        log("💡 Verifique se a URL está correta e acessível", "yellow");
      }
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao configurar webhook: ${error.message}`, "red");
    return false;
  }
}

async function getWebhookInfo() {
  log("\n📊 Verificando status do webhook...", "cyan");

  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      log(`\n📋 Status do Webhook:`, "blue");
      log(`   URL: ${info.url || "Não configurado"}`, info.url ? "green" : "yellow");
      log(`   Pendentes: ${info.pending_update_count || 0}`, "cyan");
      
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toLocaleString("pt-BR");
        log(`   ⚠️  Último erro em: ${errorDate}`, "yellow");
        log(`   Mensagem: ${info.last_error_message}`, "yellow");
      }
      
      if (info.max_connections) {
        log(`   Conexões máximas: ${info.max_connections}`, "cyan");
      }

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
  log("\n🤖 Informações do Bot:", "cyan");

  try {
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const result = await response.json();

    if (result.ok) {
      const bot = result.result;
      log(`   Nome: ${bot.first_name}`, "green");
      log(`   Username: @${bot.username}`, "green");
      log(`   ID: ${bot.id}`, "cyan");
      log(`   Link: https://t.me/${bot.username}`, "blue");
    }
  } catch (error) {
    log(`❌ Erro ao buscar informações do bot: ${error.message}`, "red");
  }
}

async function main() {
  log("\n🚀 Configuração do Webhook do Telegram\n", "blue");
  log("=".repeat(60), "cyan");

  await getBotInfo();
  await deleteWebhook();
  
  // Aguardar um pouco antes de configurar novo webhook
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  const success = await setWebhook();
  
  if (success) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await getWebhookInfo();
    
    log("\n" + "=".repeat(60), "cyan");
    log("\n✅ Configuração concluída!", "green");
    log("\n📱 Próximos passos:", "blue");
    log("   1. Teste o bot enviando /start no Telegram", "cyan");
    log("   2. Verifique os logs no Netlify Functions", "cyan");
    log("   3. Se não funcionar, execute: npm run webhook:check\n", "cyan");
  } else {
    log("\n" + "=".repeat(60), "cyan");
    log("\n❌ Falha ao configurar webhook", "red");
    log("\n💡 Verifique:", "yellow");
    log("   - TELEGRAM_BOT_TOKEN está correto?", "cyan");
    log("   - NEXT_PUBLIC_APP_URL está correto?", "cyan");
    log("   - O endpoint /api/telegram/webhook está acessível?\n", "cyan");
  }
}

main().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, "red");
  process.exit(1);
});

