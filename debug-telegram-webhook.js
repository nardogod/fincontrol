/**
 * Script para debugar o webhook do Telegram
 * Verifica se o endpoint está acessível e funcionando
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const WEBHOOK_URL = `${APP_URL}/api/telegram/webhook`;

console.log("🔍 Debug do Webhook do Telegram\n");
console.log("=".repeat(50));
console.log(`📍 URL do Webhook: ${WEBHOOK_URL}\n`);

// Testar se o endpoint está acessível
async function testWebhookEndpoint() {
  console.log("1️⃣ Testando se o endpoint está acessível...\n");

  try {
    // Tentar fazer uma requisição GET (deve retornar 405 Method Not Allowed)
    const response = await fetch(WEBHOOK_URL, {
      method: "GET",
    });

    const status = response.status;
    const text = await response.text();

    if (status === 405) {
      console.log("✅ Endpoint está acessível!");
      console.log(`   Status: ${status} (Method Not Allowed - esperado para GET)`);
      console.log(`   Resposta: ${text.substring(0, 100)}...\n`);
      return true;
    } else {
      console.log(`⚠️  Status inesperado: ${status}`);
      console.log(`   Resposta: ${text}\n`);
      return false;
    }
  } catch (error) {
    console.log("❌ Erro ao acessar endpoint:");
    console.log(`   ${error.message}\n`);
    
    if (error.message.includes("fetch")) {
      console.log("💡 Dica: O endpoint pode não estar acessível publicamente.");
      console.log("   Verifique se:");
      console.log("   - O app está deployado no Netlify");
      console.log("   - A URL está correta");
      console.log("   - Não há problemas de rede/firewall\n");
    }
    
    return false;
  }
}

// Verificar webhook no Telegram
async function checkTelegramWebhook() {
  console.log("2️⃣ Verificando webhook no Telegram...\n");

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("❌ TELEGRAM_BOT_TOKEN não encontrado\n");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      console.log(`   URL configurada: ${info.url || "Nenhuma"}`);
      console.log(`   Atualizações pendentes: ${info.pending_update_count || 0}`);
      
      if (info.last_error_date) {
        console.log(`\n   ⚠️  ÚLTIMO ERRO:`);
        console.log(`   Data: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
        console.log(`   Mensagem: ${info.last_error_message}`);
        console.log(`   Código HTTP: ${info.last_error_code || "N/A"}\n`);
      } else {
        console.log(`   ✅ Sem erros recentes\n`);
      }

      // Verificar se a URL está correta
      if (info.url && info.url !== WEBHOOK_URL) {
        console.log(`   ⚠️  ATENÇÃO: URL do webhook não corresponde!`);
        console.log(`   Esperado: ${WEBHOOK_URL}`);
        console.log(`   Configurado: ${info.url}\n`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

// Verificar se o SQL foi executado
async function checkDatabaseTables() {
  console.log("3️⃣ Verificando se as tabelas do Telegram existem...\n");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("   ⚠️  Variáveis do Supabase não configuradas");
    console.log("   Não é possível verificar as tabelas automaticamente\n");
    return;
  }

  try {
    // Tentar verificar se a tabela existe (fazendo uma query simples)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_telegram_links?select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (response.status === 200 || response.status === 404) {
      console.log("   ✅ Tabela user_telegram_links existe");
    } else if (response.status === 406) {
      console.log("   ❌ Tabela user_telegram_links NÃO existe!");
      console.log("   ⚠️  Execute o SQL telegram-bot-setup.sql no Supabase\n");
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar: ${error.message}`);
  }
}

// Simular uma atualização do Telegram
async function simulateTelegramUpdate() {
  console.log("4️⃣ Simulando atualização do Telegram...\n");

  const testUpdate = {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
      },
      chat: {
        id: 123456789,
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start",
    },
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUpdate),
    });

    const status = response.status;
    const text = await response.text();

    console.log(`   Status: ${status}`);
    console.log(`   Resposta: ${text.substring(0, 200)}...\n`);

    if (status === 200) {
      console.log("   ✅ Webhook respondeu corretamente!");
    } else {
      console.log("   ⚠️  Webhook retornou status diferente de 200");
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

async function main() {
  await testWebhookEndpoint();
  await checkTelegramWebhook();
  await checkDatabaseTables();
  await simulateTelegramUpdate();

  console.log("=".repeat(50));
  console.log("\n📋 Checklist de Problemas Comuns:\n");
  console.log("□ SQL telegram-bot-setup.sql foi executado no Supabase?");
  console.log("□ O app está deployado e acessível no Netlify?");
  console.log("□ NEXT_PUBLIC_APP_URL está correto?");
  console.log("□ TELEGRAM_BOT_TOKEN está correto?");
  console.log("□ SUPABASE_SERVICE_ROLE_KEY está configurado?");
  console.log("\n💡 Dica: Verifique os logs do Netlify para ver erros detalhados");
  console.log("   Acesse: Netlify Dashboard → Deploys → Functions Logs\n");
}

main();

