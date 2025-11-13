/**
 * Script para testar webhook de produção simulando requisição do Telegram
 * Uso: node scripts/test-webhook-prod.js
 */

const PRODUCTION_URL = "https://fincontrol-app.netlify.app/api/telegram/webhook";

async function testWebhook() {
  console.log("🧪 Testando webhook de produção...");
  console.log(`📍 URL: ${PRODUCTION_URL}\n`);

  const testPayload = {
    update_id: 999999999,
    message: {
      message_id: 999,
      from: {
        id: 8353473909,
        first_name: "Dion",
        username: "",
        is_bot: false,
      },
      chat: {
        id: 8353473909,
        first_name: "Dion",
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start",
    },
  };

  try {
    console.log("📤 Enviando requisição de teste...");
    console.log("📝 Payload:", JSON.stringify(testPayload, null, 2));
    console.log("");

    const response = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Resposta:`, JSON.stringify(data, null, 2));

    if (response.ok && data.ok) {
      console.log("\n✅ Webhook respondeu corretamente!");
      console.log("💡 Verifique os logs no Netlify para ver o processamento");
      console.log("💡 Execute: netlify logs:function telegram-webhook --live");
    } else {
      console.log("\n⚠️  Webhook respondeu mas com status diferente");
    }
  } catch (error) {
    console.error("\n❌ Erro ao testar webhook:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testWebhook();

