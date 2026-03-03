/**
 * Script para monitorar e corrigir webhook continuamente
 * Pode ser executado como serviço ou cron job mais frequente
 *
 * Uso:
 *   node scripts/monitor-webhook-continuous.js
 *
 * Para executar a cada hora:
 *   while true; do node scripts/monitor-webhook-continuous.js; sleep 3600; done
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
const CHECK_INTERVAL = parseInt(
  process.env.WEBHOOK_CHECK_INTERVAL || "3600000"
); // 1 hora padrão

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não configurado!");
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

let lastCheck = null;
let consecutiveFixes = 0;

async function checkAndFixWebhook() {
  const now = new Date();
  console.log(`\n[${now.toLocaleString("pt-BR")}] 🔍 Verificando webhook...`);

  try {
    // Verificar webhook atual
    const checkResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const checkData = await checkResponse.json();

    if (!checkData.ok) {
      console.error(`❌ Erro ao verificar webhook: ${checkData.description}`);
      return;
    }

    const currentUrl = checkData.result.url || "";
    const isCorrect = currentUrl === CORRECT_WEBHOOK_URL;
    const isIncorrectUrl = INCORRECT_URL_PATTERNS.some((pattern) =>
      currentUrl.includes(pattern)
    );

    if (isCorrect && !isIncorrectUrl) {
      console.log(`✅ Webhook está correto: ${currentUrl}`);
      consecutiveFixes = 0;
      lastCheck = { time: now, status: "ok", url: currentUrl };
      return;
    }

    // Webhook incorreto detectado!
    console.log(`⚠️  Webhook incorreto detectado: ${currentUrl}`);
    console.log(`🔧 Corrigindo para: ${CORRECT_WEBHOOK_URL}`);

    const setResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(
        CORRECT_WEBHOOK_URL
      )}&drop_pending_updates=true`
    );
    const setData = await setResponse.json();

    if (setData.ok) {
      consecutiveFixes++;
      console.log(
        `✅ Webhook corrigido! (${consecutiveFixes} correções consecutivas)`
      );

      // Verificar novamente para confirmar
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const verifyResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
      );
      const verifyData = await verifyResponse.json();

      if (verifyData.result.url === CORRECT_WEBHOOK_URL) {
        console.log(`✅ Webhook confirmado correto!`);
        lastCheck = {
          time: now,
          status: "fixed",
          url: currentUrl,
          fixedTo: CORRECT_WEBHOOK_URL,
        };
      } else {
        console.error(`❌ Erro: Webhook não foi atualizado corretamente`);
        lastCheck = {
          time: now,
          status: "error",
          url: currentUrl,
          error: "Falha na confirmação",
        };
      }

      // Se houver muitas correções consecutivas, alertar
      if (consecutiveFixes >= 3) {
        console.warn(
          `\n⚠️  ATENÇÃO: ${consecutiveFixes} correções consecutivas detectadas!`
        );
        console.warn(`   O webhook está sendo alterado frequentemente.`);
        console.warn(`   Considere investigar a causa raiz.\n`);
      }
    } else {
      console.error(`❌ Erro ao corrigir webhook: ${setData.description}`);
      lastCheck = {
        time: now,
        status: "error",
        url: currentUrl,
        error: setData.description,
      };
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar/corrigir webhook: ${error.message}`);
    lastCheck = { time: now, status: "error", error: error.message };
  }
}

// Executar verificação imediatamente
checkAndFixWebhook();

// Se CHECK_INTERVAL > 0, executar em loop
if (CHECK_INTERVAL > 0) {
  console.log(
    `\n🔄 Monitoramento contínuo ativado (verifica a cada ${
      CHECK_INTERVAL / 1000 / 60
    } minutos)`
  );
  console.log(`   Pressione Ctrl+C para parar\n`);

  setInterval(() => {
    checkAndFixWebhook();
  }, CHECK_INTERVAL);
}

// Tratamento de sinais para encerramento limpo
process.on("SIGINT", () => {
  console.log("\n\n🛑 Parando monitoramento...");
  if (lastCheck) {
    console.log(
      `📊 Última verificação: ${lastCheck.time.toLocaleString("pt-BR")}`
    );
    console.log(`   Status: ${lastCheck.status}`);
  }
  process.exit(0);
});
