/**
 * Script para configurar webhook do Telegram para Vercel
 * Uso: node scripts/set-telegram-webhook-vercel.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Função para carregar .env.local
function loadEnvFile(filename) {
  try {
    const envPath = path.join(__dirname, "..", filename);
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  } catch (error) {
    console.error(`Erro ao carregar ${filename}:`, error.message);
  }
}

// Carregar .env.local
loadEnvFile(".env.local");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não encontrado!");
  console.error("Configure a variável de ambiente no .env.local");
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error("❌ VERCEL_URL ou NEXT_PUBLIC_APP_URL não encontrado!");
  console.error("Configure a variável de ambiente ou forneça a URL do Vercel");
  process.exit(1);
}

const WEBHOOK_URL = `${VERCEL_URL}/api/telegram/webhook`;

console.log("🚀 Configurando webhook do Telegram para Vercel");
console.log("=".repeat(60));
console.log(`📍 URL do Webhook: ${WEBHOOK_URL}`);
console.log("");

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function setWebhook() {
  try {
    // Remover webhook antigo primeiro
    console.log("🗑️  Removendo webhook antigo...");
    const deleteUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`;
    const deleteResponse = await makeRequest(deleteUrl);
    console.log("✅ Webhook antigo removido");

    // Aguardar um pouco
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Configurar novo webhook
    console.log(`\n📤 Configurando novo webhook...`);
    const setUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}&drop_pending_updates=true`;
    const setResponse = await makeRequest(setUrl);

    if (setResponse.data.ok) {
      console.log("✅ Webhook configurado com sucesso!");
      console.log(`📍 URL: ${WEBHOOK_URL}`);
    } else {
      console.error("❌ Erro ao configurar webhook:");
      console.error(setResponse.data);
      process.exit(1);
    }

    // Verificar status
    console.log("\n🔍 Verificando status do webhook...");
    const checkUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const checkResponse = await makeRequest(checkUrl);

    if (checkResponse.data.ok) {
      const info = checkResponse.data.result;
      console.log(`📍 URL: ${info.url || "Não configurado"}`);
      console.log(`📊 Pendentes: ${info.pending_update_count || 0}`);
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000);
        console.log(`⚠️  Último erro: ${errorDate.toLocaleString("pt-BR")}`);
        console.log(`⚠️  Mensagem: ${info.last_error_message}`);
      } else {
        console.log("✅ Sem erros recentes");
      }
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

setWebhook();

