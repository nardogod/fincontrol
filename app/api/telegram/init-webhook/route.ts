/**
 * API Route para inicializar/verificar webhook após deploy
 * Pode ser chamada manualmente após deploy para garantir que o webhook está correto
 * 
 * Uso:
 *   GET /api/telegram/init-webhook?secret=SEU_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureWebhook, resetWebhookVerification } from "@/app/lib/telegram/webhook-guard";

const VERIFY_SECRET = process.env.WEBHOOK_VERIFY_SECRET || "default-secret-change-me";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");
  const force = searchParams.get("force") === "true";

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

  try {
    // Se force=true, resetar verificação antes
    if (force) {
      resetWebhookVerification();
    }

    // Verificar e corrigir webhook
    await ensureWebhook();

    return NextResponse.json({
      ok: true,
      message: "Webhook verificado e corrigido se necessário",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [INIT-WEBHOOK] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao verificar webhook",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
