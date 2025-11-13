/**
 * Telegram Bot Polling - Desenvolvimento Local
 * Busca atualizações do Telegram e processa localmente
 * Mostra logs diretamente no terminal
 */

const fs = require("fs");
const path = require("path");

// Carregar .env.development para desenvolvimento local
// Isso evita interferir com o webhook de produção
function loadEnvFile() {
  // Tentar carregar .env.development primeiro (preferido para dev)
  let envPath = path.join(__dirname, ".env.development");
  
  // Se não existir, usar .env.local como fallback
  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, ".env.local");
    console.log("⚠️  Usando .env.local (considere criar .env.development para separar ambientes)");
  } else {
    console.log("✅ Usando .env.development (ambiente de desenvolvimento)");
  }
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          process.env[key] = value;
        }
      }
    });
  } else {
    console.error("❌ Nenhum arquivo de ambiente encontrado (.env.development ou .env.local)");
    process.exit(1);
  }
}

loadEnvFile();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Para desenvolvimento local, sempre usar localhost
const NEXT_PUBLIC_APP_URL = "http://localhost:3000";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local");
  process.exit(1);
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
let lastUpdateId = 0;

/**
 * Busca atualizações do Telegram
 */
async function getUpdates() {
  const response = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
  const data = await response.json();
  
  if (!data.ok) {
    if (data.error_code === 409) {
      console.error("❌ Webhook ainda está ativo! Removendo...");
      await deleteWebhook();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      throw new Error("Webhook ainda ativo");
    }
    console.error("❌ Erro ao buscar atualizações:", data.description || data);
    throw new Error(data.description || "Erro desconhecido");
  }

  if (data.result && data.result.length > 0) {
    for (const update of data.result) {
      lastUpdateId = update.update_id;
      await processUpdate(update);
    }
  }
}

/**
 * Processa uma atualização
 */
async function processUpdate(update) {
  console.log("\n" + "=".repeat(60));
  console.log("📨 Nova atualização recebida");
  console.log("Update ID:", update.update_id);
  console.log("-".repeat(60));

  if (update.message) {
    const message = update.message;
    console.log("💬 Tipo: Mensagem de texto");
    console.log("📝 Texto:", message.text);
    console.log("👤 Usuário:", message.from.first_name, `(ID: ${message.from.id})`);
    console.log("💬 Username:", message.from.username || "sem username");
    console.log("📅 Data:", new Date(message.date * 1000).toLocaleString("pt-BR"));
    
    // Enviar para o webhook local
    await sendToLocalWebhook(update);
  }

  if (update.callback_query) {
    const query = update.callback_query;
    console.log("🔘 Tipo: Callback Query (botão clicado)");
    console.log("📝 Data:", query.data);
    console.log("👤 Usuário:", query.from.first_name, `(ID: ${query.from.id})`);
    console.log("💬 Username:", query.from.username || "sem username");
    
    // Enviar para o webhook local
    await sendToLocalWebhook(update);
  }
  
  console.log("=".repeat(60) + "\n");
}

/**
 * Envia atualização para o webhook local
 */
async function sendToLocalWebhook(update) {
  try {
    const webhookUrl = `${NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    console.log(`📤 Enviando para webhook local: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });

    // Verificar se a resposta é JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`❌ Resposta não é JSON. Status: ${response.status}`);
      console.error(`📄 Primeiros 200 caracteres da resposta: ${text.substring(0, 200)}`);
      console.error("💡 Certifique-se de que o servidor Next.js está rodando (npm run dev)");
      return;
    }

    const result = await response.json();
    if (result.ok) {
      console.log(`📥 Resposta do webhook: ✅ OK`);
    } else {
      console.error(`📥 Resposta do webhook: ❌ ERRO`);
      console.error("Detalhes:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro ao enviar para webhook local:", error.message);
    if (error.message.includes("fetch")) {
      console.error("💡 Certifique-se de que o servidor Next.js está rodando (npm run dev)");
      console.error("💡 Verifique se está rodando em http://localhost:3000");
    }
  }
}

/**
 * Remove webhook do Telegram (apenas se necessário)
 * ATENÇÃO: Em desenvolvimento, isso remove o webhook de produção!
 */
async function deleteWebhook() {
  try {
    console.log("🔧 Verificando webhook atual...");
    const checkResponse = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const checkData = await checkResponse.json();
    
    if (checkData.ok && checkData.result.url) {
      const webhookUrl = checkData.result.url;
      console.log(`⚠️  Webhook ativo encontrado: ${webhookUrl}`);
      
      // Se o webhook aponta para produção, avisar mas não remover automaticamente
      if (webhookUrl.includes("netlify.app") || webhookUrl.includes("fincontrol-app")) {
        console.log("⚠️  ATENÇÃO: Webhook de produção detectado!");
        console.log("⚠️  Remover o webhook de produção pode afetar usuários em produção.");
        console.log("💡 Para desenvolvimento local seguro:");
        console.log("   1. Use um bot de teste separado OU");
        console.log("   2. Aceite que o polling local vai remover o webhook de produção");
        console.log("");
        console.log("🔄 Removendo webhook para permitir polling local...");
      }
    }
    
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: false }), // Não descartar updates pendentes
    });
    const data = await response.json();
    if (data.ok) {
      console.log("✅ Webhook removido (modo desenvolvimento)\n");
      console.log("💡 Lembre-se de reconfigurar o webhook de produção após o desenvolvimento:");
      console.log("   npm run webhook:prod\n");
    } else {
      console.log("⚠️ Aviso ao remover webhook:", data.description);
    }
  } catch (error) {
    console.error("❌ Erro ao remover webhook:", error.message);
  }
}

/**
 * Loop principal de polling
 */
async function startPolling() {
  console.log("🤖 Telegram Bot Polling iniciado");
  console.log("💡 Certifique-se de que o servidor Next.js está rodando em outra janela (npm run dev)");
  console.log("🛑 Pressione Ctrl+C para parar\n");

  // Remover webhook primeiro
  await deleteWebhook();

  // Aguardar um pouco para garantir que o webhook foi removido
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("📡 Buscando atualizações do Telegram...\n");

  let errorCount = 0;
  const MAX_ERRORS = 3;

  // Loop de polling
  while (true) {
    try {
      await getUpdates();
      errorCount = 0; // Reset contador de erros em caso de sucesso
      // Aguardar 1 segundo antes da próxima busca
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      errorCount++;
      if (errorCount >= MAX_ERRORS) {
        console.error(`\n❌ Muitos erros consecutivos (${MAX_ERRORS}). Parando...`);
        console.error("💡 Verifique se o webhook foi removido corretamente");
        process.exit(1);
      }
      // Aguardar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Iniciar polling
startPolling().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});

