/**
 * Diagnostico completo do problema de producao
 * Por que o bot nao funciona quando servidor local esta OFF?
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Funcao para carregar .env.local
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
const PRODUCTION_URL = "https://fincontrol-app.netlify.app";
const WEBHOOK_URL = `${PRODUCTION_URL}/api/telegram/webhook`;

console.log(
  "╔════════════════════════════════════════════════════════════════╗"
);
console.log(
  "║  DIAGNOSTICO: Por que o bot nao funciona em producao?         ║"
);
console.log(
  "╚════════════════════════════════════════════════════════════════╝\n"
);

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data: data });
          }
        });
      })
      .on("error", reject);
  });
}

async function diagnose() {
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("1. VERIFICANDO VARIAVEIS LOCAIS (.env.local)");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  const localVars = {
    TELEGRAM_BOT_TOKEN: !!TELEGRAM_BOT_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NAO DEFINIDO",
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  for (const [key, value] of Object.entries(localVars)) {
    const status = value === true ? "✅" : value === false ? "❌" : "⚠️";
    console.log(
      `${status} ${key}: ${
        typeof value === "boolean" ? (value ? "OK" : "MISSING") : value
      }`
    );
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("2. VERIFICANDO CONFIGURACAO DO WEBHOOK DO TELEGRAM");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  try {
    const webhookInfo = await makeRequest(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );

    if (webhookInfo.data.ok) {
      const info = webhookInfo.data.result;
      console.log(`📍 URL do Webhook: ${info.url || "NAO CONFIGURADO"}`);
      console.log(`📊 Updates pendentes: ${info.pending_update_count || 0}`);

      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000);
        console.log(`❌ Ultimo erro: ${errorDate.toLocaleString("pt-BR")}`);
        console.log(`❌ Mensagem: ${info.last_error_message}`);
      } else {
        console.log("✅ Sem erros recentes");
      }

      // Verificar se webhook esta correto
      if (!info.url) {
        console.log("\n🚨 PROBLEMA ENCONTRADO: Webhook nao configurado!");
        console.log("   Solucao: npm run webhook:prod");
      } else if (info.url.includes("localhost")) {
        console.log(
          "\n🚨 PROBLEMA ENCONTRADO: Webhook apontando para localhost!"
        );
        console.log("   Solucao: npm run webhook:prod");
      } else if (info.url !== WEBHOOK_URL) {
        console.log(`\n⚠️  AVISO: Webhook configurado para URL diferente`);
        console.log(`   Esperado: ${WEBHOOK_URL}`);
        console.log(`   Atual: ${info.url}`);
      } else {
        console.log("\n✅ Webhook configurado corretamente para producao");
      }
    }
  } catch (error) {
    console.log("❌ Erro ao verificar webhook:", error.message);
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("3. TESTANDO ENDPOINT DE PRODUCAO");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  try {
    console.log(`🔍 Testando: ${WEBHOOK_URL}`);

    // Teste GET (deve retornar 405)
    const getTest = await makeRequest(WEBHOOK_URL);
    console.log(
      `   GET Request: Status ${getTest.status} ${
        getTest.status === 405 ? "✅" : "❌"
      }`
    );

    if (getTest.status === 404) {
      console.log("\n🚨 PROBLEMA ENCONTRADO: Endpoint retorna 404!");
      console.log("   Possíveis causas:");
      console.log("   1. API Route nao foi deployada");
      console.log("   2. @netlify/plugin-nextjs nao esta instalado");
      console.log("   3. netlify.toml mal configurado");
      console.log("\n   Solucoes:");
      console.log(
        "   - Verificar se @netlify/plugin-nextjs esta em package.json"
      );
      console.log("   - Verificar netlify.toml");
      console.log("   - Fazer novo deploy: npm run deploy");
    } else if (getTest.status === 405) {
      console.log("   ✅ Endpoint existe e responde corretamente");
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    console.log("\n🚨 PROBLEMA: Endpoint nao esta acessivel!");
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("4. VERIFICANDO DEPLOY NO NETLIFY");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  console.log("Execute manualmente:");
  console.log("   netlify status");
  console.log("   netlify env:list\n");

  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("5. ANALISE FINAL");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  console.log("Para o bot funcionar em producao (sem servidor local):");
  console.log("");
  console.log("✅ NECESSARIO:");
  console.log("   1. Webhook configurado para: " + WEBHOOK_URL);
  console.log("   2. Endpoint respondendo (nao 404)");
  console.log("   3. Variaveis de ambiente no Netlify:");
  console.log("      - TELEGRAM_BOT_TOKEN");
  console.log("      - NEXT_PUBLIC_SUPABASE_URL");
  console.log("      - SUPABASE_SERVICE_ROLE_KEY");
  console.log("      - NEXT_PUBLIC_APP_URL");
  console.log("      - DATABASE_URL (se usar Postgres direto)");
  console.log("");
  console.log("🔧 SE O BOT NAO FUNCIONA EM PRODUCAO:");
  console.log("   1. Variaveis de ambiente estao no Netlify?");
  console.log("      → Execute: npm run setup:netlify:ps");
  console.log("   2. Webhook esta correto?");
  console.log("      → Execute: npm run webhook:prod");
  console.log("   3. Fez deploy recente?");
  console.log("      → Execute: npm run deploy");
  console.log("   4. Aguardou 2-3 minutos apos deploy?");
  console.log("      → Aguarde e teste novamente");
  console.log("");
  console.log("📊 COMO TESTAR:");
  console.log("   1. npm run test:webhook (testa endpoint)");
  console.log("   2. Enviar /start no Telegram");
  console.log("   3. netlify logs:function telegram-webhook --live (ver logs)");
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );
}

diagnose().catch(console.error);
