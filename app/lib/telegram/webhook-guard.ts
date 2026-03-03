/**
 * Webhook Guard - Verifica e corrige webhook apenas uma vez por deploy
 * Evita verificações desnecessárias a cada requisição
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CORRECT_WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
  : "https://fincontrol-bot.vercel.app/api/telegram/webhook";

// URLs incorretas conhecidas que devem ser corrigidas
const INCORRECT_URL_PATTERNS = [
  "network-bots.adaptgroup.pro", // Servidor de spam/VPN
  "adaptgroup.pro", // Domínio relacionado ao spam
  "bots.cdn-global.pro", // CDN suspeito
  "dash.adaptgroup.pro", // Painel do serviço de spam
  "fincontrol.netlify.app", // URL antiga sem -app
];

// Estado global (persiste durante o ciclo de vida do servidor)
let webhookVerified = false;
let verificationInProgress = false;
let lastVerificationTime: number | null = null;
const VERIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutos de cooldown entre verificações

/**
 * Verifica e corrige o webhook se necessário
 * Executa apenas uma vez por deploy ou quando necessário
 */
export async function ensureWebhook(): Promise<void> {
  // Se já foi verificado recentemente, não verificar novamente
  if (webhookVerified && lastVerificationTime) {
    const timeSinceLastCheck = Date.now() - lastVerificationTime;
    if (timeSinceLastCheck < VERIFICATION_COOLDOWN) {
      return; // Ainda dentro do cooldown
    }
  }

  // Se já está verificando, não iniciar outra verificação
  if (verificationInProgress) {
    return;
  }

  verificationInProgress = true;

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("❌ [WEBHOOK-GUARD] TELEGRAM_BOT_TOKEN não configurado");
      return;
    }

    console.log("🔍 [WEBHOOK-GUARD] Verificando webhook...");

    const checkResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const checkData = await checkResponse.json();

    if (!checkData.ok) {
      console.error(
        `❌ [WEBHOOK-GUARD] Erro ao verificar webhook: ${checkData.description}`
      );
      return;
    }

    const currentUrl = checkData.result.url || "";
    const isCorrect = currentUrl === CORRECT_WEBHOOK_URL;
    const isIncorrectUrl = INCORRECT_URL_PATTERNS.some((pattern) =>
      currentUrl.includes(pattern)
    );

    // Se está correto e não é uma URL incorreta conhecida, marcar como verificado
    if (isCorrect && !isIncorrectUrl) {
      console.log("✅ [WEBHOOK-GUARD] Webhook já está correto");
      webhookVerified = true;
      lastVerificationTime = Date.now();
      return;
    }

    // Se está incorreto, corrigir
    if (!isCorrect || isIncorrectUrl) {
      console.log(
        `⚠️ [WEBHOOK-GUARD] Webhook incorreto detectado: ${currentUrl}`
      );
      console.log(`🔧 [WEBHOOK-GUARD] Corrigindo para: ${CORRECT_WEBHOOK_URL}`);

      const setResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(CORRECT_WEBHOOK_URL)}&drop_pending_updates=true`
      );
      const setData = await setResponse.json();

      if (setData.ok) {
        console.log("✅ [WEBHOOK-GUARD] Webhook corrigido com sucesso");

        // Aguardar um pouco antes de verificar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verificar novamente para confirmar
        const verifyResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
        );
        const verifyData = await verifyResponse.json();

        if (verifyData.result?.url === CORRECT_WEBHOOK_URL) {
          console.log("✅ [WEBHOOK-GUARD] Webhook confirmado correto");
          webhookVerified = true;
          lastVerificationTime = Date.now();
        } else {
          console.warn(
            "⚠️ [WEBHOOK-GUARD] Webhook atualizado, mas verificação mostra URL diferente"
          );
          // Não marcar como verificado se não confirmou
          webhookVerified = false;
        }
      } else {
        console.error(
          `❌ [WEBHOOK-GUARD] Erro ao corrigir webhook: ${setData.description}`
        );
        webhookVerified = false;
      }
    }
  } catch (error: any) {
    console.error(
      `❌ [WEBHOOK-GUARD] Erro ao verificar/corrigir webhook: ${error.message}`
    );
    webhookVerified = false;
  } finally {
    verificationInProgress = false;
  }
}

/**
 * Força uma nova verificação (útil após deploy)
 */
export function resetWebhookVerification(): void {
  webhookVerified = false;
  lastVerificationTime = null;
  console.log("🔄 [WEBHOOK-GUARD] Verificação resetada");
}

/**
 * Retorna o status da verificação
 */
export function getWebhookStatus(): {
  verified: boolean;
  lastCheck: number | null;
} {
  return {
    verified: webhookVerified,
    lastCheck: lastVerificationTime,
  };
}
