/**
 * Script de Diagnóstico Completo de Produção
 * Verifica endpoint, variáveis de ambiente, deploy e webhook
 * 
 * Uso: npm run diagnose
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

const PRODUCTION_URL = "https://fincontrol-app.netlify.app";
const WEBHOOK_ENDPOINT = `${PRODUCTION_URL}/api/telegram/webhook`;

async function testEndpoint() {
  log("\n1️⃣ Testando endpoint de produção...", "cyan");
  log(`   URL: ${WEBHOOK_ENDPOINT}`, "blue");

  try {
    const testPayload = {
      update_id: 999999999,
      message: {
        message_id: 1,
        from: {
          id: 123456789,
          first_name: "Test",
          is_bot: false,
        },
        chat: {
          id: 123456789,
          type: "private",
        },
        text: "test",
        date: Math.floor(Date.now() / 1000),
      },
    };

    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      log(`   ✅ Endpoint respondeu: ${response.status}`, "green");
      log(`   ✅ Resposta: ${JSON.stringify(data)}`, "green");
      return true;
    } else {
      log(`   ⚠️  Endpoint respondeu: ${response.status}`, "yellow");
      log(`   ⚠️  Resposta: ${JSON.stringify(data)}`, "yellow");
      return false;
    }
  } catch (error) {
    log(`   ❌ Erro no endpoint: ${error.message}`, "red");
    if (error.response) {
      log(`   ❌ Status: ${error.response.status}`, "red");
      log(`   ❌ Detalhes: ${JSON.stringify(error.response.data)}`, "red");
    }
    return false;
  }
}

function checkNetlifyVariables() {
  log("\n2️⃣ Verificando variáveis no Netlify...", "cyan");

  const requiredVars = [
    "TELEGRAM_BOT_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  try {
    // Tentar listar variáveis (pode pedir confirmação interativa)
    const envList = execSync("netlify env:list", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      input: "N\n", // Responder "N" para não mostrar valores
    });

    log("   Variáveis encontradas:", "blue");
    console.log(envList);

    let missingVars = [];
    for (const varName of requiredVars) {
      if (!envList.includes(varName)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      log(`   ❌ Variáveis faltando: ${missingVars.join(", ")}`, "red");
      return false;
    } else {
      log("   ✅ Todas as variáveis obrigatórias estão configuradas", "green");
      return true;
    }
  } catch (error) {
    // Se falhar, tentar verificar individualmente
    log("   ⚠️  Não foi possível listar todas as variáveis", "yellow");
    log("   💡 Verificando variáveis individualmente...", "cyan");

    let foundCount = 0;
    for (const varName of requiredVars) {
      try {
        execSync(`netlify env:get ${varName}`, {
          encoding: "utf8",
          stdio: "ignore",
        });
        foundCount++;
        log(`   ✅ ${varName} encontrada`, "green");
      } catch (e) {
        log(`   ❌ ${varName} não encontrada`, "red");
      }
    }

    if (foundCount === requiredVars.length) {
      log("   ✅ Todas as variáveis obrigatórias estão configuradas", "green");
      return true;
    } else {
      log(`   ⚠️  ${foundCount}/${requiredVars.length} variáveis encontradas`, "yellow");
      log("   💡 Configure: npm run setup:netlify:auto", "cyan");
      return false;
    }
  }
}

function checkNetlifyStatus() {
  log("\n3️⃣ Verificando status do deploy...", "cyan");

  try {
    const status = execSync("netlify status", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    log("   Status do Netlify:", "blue");
    console.log(status);

    if (status.includes("fincontrol-app")) {
      log("   ✅ Projeto encontrado no Netlify", "green");
      return true;
    } else {
      log("   ⚠️  Projeto não encontrado", "yellow");
      return false;
    }
  } catch (error) {
    log(`   ❌ Erro ao verificar status: ${error.message}`, "red");
    return false;
  }
}

async function checkWebhook() {
  log("\n4️⃣ Verificando webhook do Telegram...", "cyan");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    log("   ❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local", "red");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const data = await response.json();

    if (data.ok) {
      const webhook = data.result;
      log(`   URL: ${webhook.url || "Não configurado"}`, "blue");
      log(`   Pendentes: ${webhook.pending_update_count || 0}`, "blue");

      if (webhook.url === WEBHOOK_ENDPOINT) {
        log("   ✅ Webhook configurado corretamente", "green");
      } else if (webhook.url) {
        log("   ⚠️  Webhook aponta para URL diferente", "yellow");
        log(`   Esperado: ${WEBHOOK_ENDPOINT}`, "yellow");
      } else {
        log("   ❌ Webhook não configurado", "red");
      }

      if (webhook.last_error_date) {
        const errorDate = new Date(webhook.last_error_date * 1000);
        log(`   ⚠️  Último erro: ${errorDate.toLocaleString("pt-BR")}`, "yellow");
        log(`   Mensagem: ${webhook.last_error_message}`, "yellow");
        return false;
      } else {
        log("   ✅ Nenhum erro recente", "green");
        return true;
      }
    } else {
      log(`   ❌ Erro ao verificar webhook: ${data.description}`, "red");
      return false;
    }
  } catch (error) {
    log(`   ❌ Erro ao verificar webhook: ${error.message}`, "red");
    return false;
  }
}

async function diagnose() {
  log("\n🔍 DIAGNÓSTICO COMPLETO DE PRODUÇÃO\n", "blue");
  log("=".repeat(60), "cyan");

  const results = {
    endpoint: false,
    variables: false,
    status: false,
    webhook: false,
  };

  // 1. Testar endpoint
  results.endpoint = await testEndpoint();

  // 2. Verificar variáveis
  results.variables = checkNetlifyVariables();

  // 3. Verificar deploy
  results.status = checkNetlifyStatus();

  // 4. Verificar webhook
  results.webhook = await checkWebhook();

  // Resumo
  log("\n" + "=".repeat(60), "cyan");
  log("\n📊 RESUMO DO DIAGNÓSTICO:", "blue");
  log(`   Endpoint: ${results.endpoint ? "✅ OK" : "❌ ERRO"}`, results.endpoint ? "green" : "red");
  log(`   Variáveis: ${results.variables ? "✅ OK" : "❌ ERRO"}`, results.variables ? "green" : "red");
  log(`   Status: ${results.status ? "✅ OK" : "❌ ERRO"}`, results.status ? "green" : "red");
  log(`   Webhook: ${results.webhook ? "✅ OK" : "❌ ERRO"}`, results.webhook ? "green" : "red");

  const allOk = Object.values(results).every((v) => v === true);

  log("\n" + "=".repeat(60), "cyan");

  if (allOk) {
    log("\n✅ TUDO OK! Sistema pronto para produção.", "green");
    log("\n💡 Próximos passos:", "cyan");
    log("   1. Teste o bot enviando /start no Telegram", "cyan");
    log("   2. Verifique logs: netlify logs:function telegram-webhook --live", "cyan");
  } else {
    log("\n⚠️  PROBLEMAS ENCONTRADOS", "yellow");
    log("\n💡 Ações recomendadas:", "cyan");

    if (!results.endpoint) {
      log("   1. Endpoint com erro:", "yellow");
      log("      • Verifique se o deploy foi concluído: npm run deploy", "cyan");
      log("      • Verifique logs: netlify logs:function telegram-webhook --live", "cyan");
    }

    if (!results.variables) {
      log("   2. Variáveis não configuradas:", "yellow");
      log("      • Configure: npm run setup:netlify:auto", "cyan");
      log("      • Ou manualmente: https://app.netlify.com/sites/fincontrol-app/settings/env", "cyan");
    }

    if (!results.status) {
      log("   3. Status do Netlify:", "yellow");
      log("      • Verifique login: netlify login", "cyan");
      log("      • Verifique projeto: netlify status", "cyan");
    }

    if (!results.webhook) {
      log("   4. Webhook com problemas:", "yellow");
      log("      • Configure: npm run webhook:prod", "cyan");
      log("      • Verifique: npm run webhook:check", "cyan");
    }
  }

  log("\n" + "=".repeat(60) + "\n", "cyan");
}

diagnose().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});

