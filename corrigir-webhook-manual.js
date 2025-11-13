/**
 * Script para corrigir manualmente o webhook do Telegram
 * Use quando a URL do webhook estiver incorreta
 */

const fs = require("fs");
const path = require("path");

// Carregar .env.local
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
  console.error("❌ TELEGRAM_BOT_TOKEN não configurado");
  process.exit(1);
}

// URL CORRETA do seu site
const CORRECT_URL = "https://fincontrol-app.netlify.app";
const WEBHOOK_URL = `${CORRECT_URL}/api/telegram/webhook`;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function fixWebhook() {
  console.log("🔧 Corrigindo webhook do Telegram...\n");
  console.log(`📍 URL correta: ${WEBHOOK_URL}\n`);

  try {
    // 1. Remover webhook antigo
    console.log("1️⃣ Removendo webhook antigo...");
    const deleteResponse = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
      method: "POST",
    });
    const deleteResult = await deleteResponse.json();
    
    if (deleteResult.ok) {
      console.log("   ✅ Webhook antigo removido\n");
    } else {
      console.log("   ⚠️  Não havia webhook para remover\n");
    }

    // 2. Configurar novo webhook
    console.log("2️⃣ Configurando novo webhook...");
    const setResponse = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: WEBHOOK_URL }),
    });

    const setResult = await setResponse.json();

    if (setResult.ok) {
      console.log("   ✅ Webhook configurado com sucesso!\n");
    } else {
      console.error("   ❌ Erro ao configurar webhook:", setResult.description);
      process.exit(1);
    }

    // 3. Verificar webhook
    console.log("3️⃣ Verificando webhook...");
    const checkResponse = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const checkResult = await checkResponse.json();

    if (checkResult.ok) {
      const info = checkResult.result;
      console.log(`   URL configurada: ${info.url}`);
      console.log(`   Atualizações pendentes: ${info.pending_update_count || 0}`);
      
      if (info.url === WEBHOOK_URL) {
        console.log("   ✅ URL está correta!\n");
      } else {
        console.log(`   ⚠️  URL ainda está incorreta: ${info.url}`);
        console.log(`   Esperado: ${WEBHOOK_URL}\n`);
      }

      if (info.last_error_date) {
        console.log(`   ⚠️  Último erro: ${info.last_error_message}`);
      } else {
        console.log("   ✅ Sem erros recentes\n");
      }
    }

    console.log("=".repeat(50));
    console.log("✅ Webhook corrigido!");
    console.log("\n📱 Próximos passos:");
    console.log("   1. Teste no Telegram enviando /start");
    console.log("   2. Execute: npm run telegram:test");
    console.log("   3. Verifique se não há mais erros\n");

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

fixWebhook();

