/**
 * Script para testar o bot do Telegram
 * Execute: node test-telegram-bot.js
 * 
 * Requer: TELEGRAM_BOT_TOKEN no .env.local
 * 
 * IMPORTANTE: Este script APENAS verifica, NÃO interfere com o webhook de produção
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

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não configurado no .env.local");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function testBot() {
  console.log("🔍 Teste do Bot do Telegram");
  console.log("=".repeat(50));

  try {
    // 1. Testar conexão
    console.log("🤖 Testando conexão com o bot...");
    const meResponse = await fetch(`${TELEGRAM_API}/getMe`);
    const meResult = await meResponse.json();

    if (!meResult.ok) {
      console.error("❌ Erro ao conectar:", meResult.description);
      return;
    }

    const bot = meResult.result;

    console.log("✅ Bot conectado com sucesso!");
    console.log("\n📋 Informações do bot:");
    console.log(`   Nome: ${bot.first_name}`);
    console.log(`   Username: @${bot.username}`);
    console.log(`   ID: ${bot.id}`);
    console.log(`   Link: https://t.me/${bot.username}`);

    // 2. Verificar webhook (SEM REMOVER)
    console.log("\n📊 Verificando webhook...");
    const webhookResponse = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const webhookResult = await webhookResponse.json();

    if (webhookResult.ok) {
      const webhook = webhookResult.result;

      if (webhook.url) {
        console.log("✅ Webhook configurado");
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Atualizações pendentes: ${webhook.pending_update_count || 0}`);

        if (webhook.last_error_date) {
          const errorDate = new Date(webhook.last_error_date * 1000);
          console.log(
            `   ⚠️  Último erro em: ${errorDate.toLocaleString("pt-BR")}`
          );
          console.log(`   ⚠️  Mensagem: ${webhook.last_error_message}`);
        } else {
          console.log("   ✅ Sem erros recentes");
        }

        if (webhook.max_connections) {
          console.log(`   🔗 Conexões máximas: ${webhook.max_connections}`);
        }
      } else {
        console.log("⚠️  Webhook não configurado (modo polling)");
        console.log("   💡 Execute: npm run webhook:prod");
      }
    } else {
      console.error("❌ Erro ao verificar webhook:", webhookResult.description);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Teste concluído!");
    console.log("\n💡 Para testar o bot:");
    console.log(`   1. Abra o Telegram`);
    console.log(`   2. Busque @${bot.username}`);
    console.log("   3. Envie /start");
    console.log("\n⚠️  IMPORTANTE: Este script apenas verifica, não modifica o webhook!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.response) {
      console.error("   Detalhes:", error.response.data);
    }
  }
}

testBot();
