/**
 * API Route para verificar e corrigir automaticamente o webhook do Telegram
 * Pode ser chamada manualmente ou por um cron job
 *
 * Uso:
 *   GET /api/telegram/verify-webhook?secret=SEU_SECRET
 */

import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CORRECT_WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
  : "https://fincontrol-bot.vercel.app/api/telegram/webhook";
const VERIFY_SECRET =
  process.env.WEBHOOK_VERIFY_SECRET || "default-secret-change-me";

// URLs incorretas conhecidas que devem ser corrigidas
const INCORRECT_URL_PATTERNS = [
  "network-bots.adaptgroup.pro", // Servidor de spam/VPN
  "adaptgroup.pro", // Domínio relacionado ao spam
  "bots.cdn-global.pro", // CDN suspeito
  "dash.adaptgroup.pro", // Painel do serviço de spam
  "fincontrol.netlify.app", // URL antiga sem -app
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");

  // Verificar autenticação básica
  if (secret !== VERIFY_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        message: "Forneça o parâmetro secret correto",
      },
      { status: 401 }
    );
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error: "TELEGRAM_BOT_TOKEN não configurado",
      },
      { status: 500 }
    );
  }

  try {
    // 1. Verificar webhook atual
    const checkResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const checkData = await checkResponse.json();

    if (!checkData.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Erro ao verificar webhook",
          description: checkData.description,
        },
        { status: 500 }
      );
    }

    const currentUrl = checkData.result.url || "";
    const isCorrect = currentUrl === CORRECT_WEBHOOK_URL;

    // 2. Verificar se é uma URL incorreta conhecida
    const isIncorrectUrl = INCORRECT_URL_PATTERNS.some((pattern) =>
      currentUrl.includes(pattern)
    );

    // 3. Se estiver incorreto, corrigir
    if (!isCorrect || isIncorrectUrl) {
      console.log(`⚠️ [WEBHOOK] URL incorreta detectada: ${currentUrl}`);
      console.log(`🔧 [WEBHOOK] Corrigindo para: ${CORRECT_WEBHOOK_URL}`);

      // Validação adicional: garantir que a URL correta é válida
      if (!CORRECT_WEBHOOK_URL.startsWith("https://")) {
        return NextResponse.json(
          {
            ok: false,
            fixed: false,
            error: "URL do webhook inválida",
            message: "A URL do webhook deve começar com https://",
            currentUrl,
            correctUrl: CORRECT_WEBHOOK_URL,
          },
          { status: 500 }
        );
      }

      const setResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(
          CORRECT_WEBHOOK_URL
        )}&drop_pending_updates=true`
      );
      const setData = await setResponse.json();

      if (setData.ok) {
        // Aguardar um pouco antes de verificar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verificar novamente para confirmar
        const verifyResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
        );
        const verifyData = await verifyResponse.json();

        const verifiedUrl = verifyData.result?.url || "";

        return NextResponse.json({
          ok: true,
          fixed: true,
          previousUrl: currentUrl,
          currentUrl: verifiedUrl,
          correctUrl: CORRECT_WEBHOOK_URL,
          message:
            verifiedUrl === CORRECT_WEBHOOK_URL
              ? "Webhook corrigido com sucesso"
              : "Webhook atualizado, mas verificação mostra URL diferente",
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          {
            ok: false,
            fixed: false,
            error: "Erro ao corrigir webhook",
            description: setData.description,
            errorCode: setData.error_code,
            currentUrl,
            correctUrl: CORRECT_WEBHOOK_URL,
          },
          { status: 500 }
        );
      }
    }

    // 4. Webhook já está correto
    return NextResponse.json({
      ok: true,
      fixed: false,
      currentUrl,
      correctUrl: CORRECT_WEBHOOK_URL,
      message: "Webhook já está correto",
      pendingUpdates: checkData.result.pending_update_count || 0,
      lastError: checkData.result.last_error_message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [WEBHOOK] Erro ao verificar/corrigir:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao processar verificação",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
