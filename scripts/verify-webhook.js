/**
 * Script para verificar e corrigir o webhook do Telegram
 * Executa automaticamente quando detecta que o webhook está incorreto
 *
 * Uso:
 *   npm run webhook:verify
 *
 * Variáveis de ambiente necessárias:
 *   - TELEGRAM_BOT_TOKEN: Token do bot do Telegram
 *   - NEXT_PUBLIC_APP_URL: URL da aplicação (opcional, usa padrão se não definido)
 */

const fs = require("fs");
const path = require("path");

// Carregar .env.local se existir
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://fincontrol-bot.vercel.app";
const CORRECT_WEBHOOK_URL = `${APP_URL}/api/telegram/webhook`;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não configurado!");
  console.error("💡 Configure no .env.local ou como variável de ambiente");
  process.exit(1);
}

// URLs incorretas conhecidas que devem ser corrigidas
const INCORRECT_URL_PATTERNS = [
  "network-bots.adaptgroup.pro", // Servidor de spam/VPN
  "adaptgroup.pro", // Domínio relacionado ao spam
  "bots.cdn-global.pro", // CDN suspeito
  "dash.adaptgroup.pro", // Painel do serviço de spam
  "fincontrol.netlify.app", // URL antiga sem -app
];

async function verifyAndFixWebhook() {
  console.log("🔍 Verificando webhook do Telegram...\n");

  try {
    // 1. Verificar webhook atual
    const checkResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const checkData = await checkResponse.json();

    if (!checkData.ok) {
      console.error("❌ Erro ao verificar webhook:", checkData.description);
      process.exit(1);
    }

    const currentUrl = checkData.result.url || "";
    console.log(`📍 URL atual: ${currentUrl}`);
    console.log(`📍 URL esperada: ${CORRECT_WEBHOOK_URL}`);

    // 2. Verificar se está correto
    if (currentUrl === CORRECT_WEBHOOK_URL) {
      console.log("\n✅ Webhook está correto!");

      // Mostrar informações adicionais
      if (checkData.result.pending_update_count > 0) {
        console.log(
          `⚠️  Há ${checkData.result.pending_update_count} atualizações pendentes`
        );
      }

      if (checkData.result.last_error_message) {
        console.log(`⚠️  Último erro: ${checkData.result.last_error_message}`);
        console.log(
          `   Data: ${new Date(
            checkData.result.last_error_date * 1000
          ).toLocaleString()}`
        );
      } else {
        console.log("✅ Sem erros recentes");
      }

      return;
    }

    // 3. Verificar se é uma URL incorreta conhecida
    const isIncorrectUrl = INCORRECT_URL_PATTERNS.some((pattern) =>
      currentUrl.includes(pattern)
    );

    if (isIncorrectUrl || currentUrl !== CORRECT_WEBHOOK_URL) {
      console.log("\n⚠️  Webhook está apontando para URL incorreta!");
      console.log("🔧 Corrigindo webhook...\n");

      // 4. Configurar webhook correto
      const setResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(
          CORRECT_WEBHOOK_URL
        )}&drop_pending_updates=true`
      );
      const setData = await setResponse.json();

      if (setData.ok) {
        console.log("✅ Webhook corrigido com sucesso!");
        console.log(`   Nova URL: ${CORRECT_WEBHOOK_URL}`);

        // 5. Verificar novamente
        const verifyResponse = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
        );
        const verifyData = await verifyResponse.json();

        if (verifyData.result.url === CORRECT_WEBHOOK_URL) {
          console.log("✅ Webhook confirmado!");
        } else {
          console.error("❌ Erro: Webhook não foi atualizado corretamente");
          process.exit(1);
        }
      } else {
        console.error("❌ Erro ao corrigir webhook:", setData.description);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar/corrigir webhook:", error.message);
    process.exit(1);
  }
}

verifyAndFixWebhook();
