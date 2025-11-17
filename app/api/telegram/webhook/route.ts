/**
 * Telegram Bot Webhook
 * Recebe atualizações do Telegram e processa comandos
 */

import { NextRequest, NextResponse } from "next/server";
import {
  handleStartCommand,
  handleExpenseCommand,
  handleIncomeCommand,
  handleAccountsCommand,
  handleTodayCommand,
  handleMonthCommand,
  handleMetaCommand,
  handleUpdateForecastCommand,
  handleHelpCommand,
  handleCallbackQuery,
  handleNaturalLanguage,
} from "@/app/lib/telegram/commands";
import { sendMessage } from "@/app/lib/telegram/bot";
import type {
  TelegramMessage,
  TelegramCallbackQuery,
} from "@/app/lib/telegram/bot";

export async function POST(request: NextRequest) {
  console.log("🔔 [WEBHOOK] Requisição recebida");

  try {
    // Verificar variáveis de ambiente
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasToken) {
      console.error("❌ [WEBHOOK] TELEGRAM_BOT_TOKEN não configurado");
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 500 }
      );
    }

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error("❌ [WEBHOOK] Variáveis do Supabase não configuradas!");
      return NextResponse.json(
        { ok: false, error: "Missing Supabase config" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Verificar se é uma atualização válida
    if (!body.update_id) {
      console.log("⚠️ [WEBHOOK] Update sem update_id, ignorando");
      return NextResponse.json({ ok: true });
    }

    // IMPORTANTE: Retornar 200 OK imediatamente para o Telegram
    // Processar comandos de forma assíncrona após retornar
    const responsePromise = NextResponse.json({ ok: true });

    // Processar mensagem de texto de forma assíncrona
    if (body.message?.text) {
      const message: TelegramMessage = body.message;
      const text = message.text.trim();
      const args = text.split(/\s+/).slice(1); // Remove o comando

      // Processar comandos de forma assíncrona (não bloquear resposta)
      Promise.resolve().then(async () => {
        try {
          if (text.startsWith("/start")) {
            await handleStartCommand(message);
          } else if (text.startsWith("/gasto")) {
            await handleExpenseCommand(message, args);
          } else if (text.startsWith("/receita")) {
            await handleIncomeCommand(message, args);
          } else if (text.startsWith("/contas")) {
            await handleAccountsCommand(message);
          } else if (text.startsWith("/hoje")) {
            await handleTodayCommand(message);
          } else if (text.startsWith("/mes")) {
            await handleMonthCommand(message);
          } else if (text.startsWith("/meta")) {
            console.log("✅ [WEBHOOK] Executando /meta");
            await handleMetaCommand(message);
            console.log(`✅ [WEBHOOK] /meta processado com sucesso`);
          } else if (text.startsWith("/atualizar_previsao")) {
            console.log("✅ [WEBHOOK] Executando /atualizar_previsao");
            await handleUpdateForecastCommand(message);
            console.log(
              `✅ [WEBHOOK] /atualizar_previsao processado com sucesso`
            );
          } else if (text.startsWith("/help")) {
            await handleHelpCommand(message);
          } else if (text.startsWith("/")) {
            // Comando desconhecido
            await sendMessage(
              message.chat.id,
              `❓ Comando não reconhecido: ${text}\n\n` +
                `Use /help para ver todos os comandos disponíveis.`
            );
          } else {
            // Tentar processar como linguagem natural
            await handleNaturalLanguage(message);
          }
        } catch (cmdError) {
          console.error("❌ [WEBHOOK] Erro ao processar comando:", cmdError);
          try {
            await sendMessage(
              message.chat.id,
              "❌ Desculpe, ocorreu um erro ao processar seu comando. Tente novamente."
            );
          } catch (sendError) {
            console.error(
              "❌ [WEBHOOK] Erro ao enviar mensagem de erro:",
              sendError
            );
          }
        }
      });
    }

    // Processar callback query (cliques em botões) de forma assíncrona
    if (body.callback_query) {
      const query: TelegramCallbackQuery = body.callback_query;
      Promise.resolve().then(async () => {
        try {
          await handleCallbackQuery(query);
        } catch (callbackError) {
          console.error(
            "❌ [WEBHOOK] Erro em handleCallbackQuery:",
            callbackError
          );
        }
      });
    }

    // Retornar OK imediatamente para o Telegram
    return responsePromise;
  } catch (error) {
    console.error("❌ [WEBHOOK] Erro ao processar webhook do Telegram:", error);
    // IMPORTANTE: Sempre retornar OK para o Telegram
    // Se retornar erro, o Telegram vai tentar reenviar e pode causar loops
    return NextResponse.json({ ok: true });
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
