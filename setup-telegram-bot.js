/**
 * Script para configurar o bot do Telegram
 * Execute: node setup-telegram-bot.js
 * 
 * Requer: TELEGRAM_BOT_TOKEN e NEXT_PUBLIC_APP_URL no .env.local
 */

const fs = require("fs");
const path = require("path");

// Função para carregar .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env.local");
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
let APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não configurado no .env.local");
  process.exit(1);
}

if (!APP_URL) {
  console.error("❌ NEXT_PUBLIC_APP_URL não configurado no .env.local");
  console.error("💡 Configure no Netlify: Site settings → Environment variables");
  process.exit(1);
}

// Verificar se a URL está correta
if (APP_URL.includes("fincontrol.netlify.app") && !APP_URL.includes("fincontrol-app")) {
  console.warn("⚠️  ATENÇÃO: URL pode estar incorreta!");
  console.warn(`   Configurado: ${APP_URL}`);
  console.warn(`   Esperado: https://fincontrol-app.netlify.app`);
  console.warn("   Verifique se NEXT_PUBLIC_APP_URL está correto no Netlify\n");
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function setWebhook() {
  const webhookUrl = `${APP_URL}/api/telegram/webhook`;
  
  console.log("🔧 Configurando webhook...");
  console.log(`📍 URL: ${webhookUrl}`);

  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log("✅ Webhook configurado com sucesso!");
    } else {
      console.error("❌ Erro ao configurar webhook:", result.description);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erro ao configurar webhook:", error);
    process.exit(1);
  }
}

async function setCommands() {
  console.log("\n🔧 Configurando comandos do bot...");

  const commands = [
    { command: "start", description: "Iniciar bot e vincular conta" },
    { command: "gasto", description: "Registrar uma despesa" },
    { command: "receita", description: "Registrar uma receita" },
    { command: "contas", description: "Ver suas contas" },
    { command: "hoje", description: "Resumo do dia" },
    { command: "mes", description: "Resumo do mês" },
    { command: "help", description: "Ver todos os comandos" },
  ];

  try {
    const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log("✅ Comandos configurados com sucesso!");
      console.log("📋 Comandos disponíveis:");
      commands.forEach((cmd) => {
        console.log(`   /${cmd.command} - ${cmd.description}`);
      });
    } else {
      console.error("❌ Erro ao configurar comandos:", result.description);
    }
  } catch (error) {
    console.error("❌ Erro ao configurar comandos:", error);
  }
}

async function getBotInfo() {
  console.log("\n🤖 Informações do bot:");

  try {
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const result = await response.json();

    if (result.ok) {
      const bot = result.result;
      console.log(`   Nome: ${bot.first_name}`);
      console.log(`   Username: @${bot.username}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Link: https://t.me/${bot.username}`);
    }
  } catch (error) {
    console.error("❌ Erro ao buscar informações do bot:", error);
  }
}

async function getWebhookInfo() {
  console.log("\n📊 Status do webhook:");

  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      console.log(`   URL: ${info.url || "Não configurado"}`);
      console.log(`   Pendentes: ${info.pending_update_count || 0}`);
      if (info.last_error_message) {
        console.log(`   ⚠️  Último erro: ${info.last_error_message}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar status do webhook:", error);
  }
}

async function main() {
  console.log("🚀 Configurando Bot do Telegram\n");
  console.log("=" .repeat(50));

  await getBotInfo();
  await setWebhook();
  await setCommands();
  await getWebhookInfo();

  console.log("\n" + "=".repeat(50));
  console.log("✅ Configuração concluída!");
  console.log("\n📱 Próximos passos:");
  console.log("   1. Execute o schema SQL no Supabase (telegram-bot-setup.sql)");
  console.log("   2. Abra o Telegram e procure pelo bot");
  console.log("   3. Envie /start para começar");
}

main();

