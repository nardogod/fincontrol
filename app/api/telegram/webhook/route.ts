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
  handleHelpCommand,
  handleCallbackQuery,
} from "@/app/lib/telegram/commands";
import type { TelegramMessage, TelegramCallbackQuery } from "@/app/lib/telegram/bot";

export async function POST(request: NextRequest) {
  try {
    // Verificar se o bot token está configurado
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("❌ TELEGRAM_BOT_TOKEN não configurado");
      console.error("Configure a variável de ambiente no Netlify");
      return NextResponse.json({ error: "Bot token não configurado" }, { status: 500 });
    }

    const body = await request.json();

    // Log para debug
    console.log("📨 Telegram webhook received");
    console.log("Update ID:", body.update_id);
    if (body.message) {
      console.log("Message:", body.message.text);
      console.log("From:", body.message.from.id);
    }

    // Verificar se é uma atualização válida
    if (!body.update_id) {
      return NextResponse.json({ ok: true });
    }

    // Processar mensagem de texto
    if (body.message?.text) {
      const message: TelegramMessage = body.message;
      const text = message.text.trim();
      const args = text.split(/\s+/).slice(1); // Remove o comando

      // Processar comandos
      console.log(`🔧 Processando comando: ${text}`);
      
      if (text.startsWith("/start")) {
        console.log("✅ Executando /start");
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
      } else if (text.startsWith("/help")) {
        await handleHelpCommand(message);
      } else {
        // Mensagem não reconhecida
        await import("@/app/lib/telegram/bot").then(({ sendMessage }) =>
          sendMessage(
            message.chat.id,
            "❓ Comando não reconhecido. Use /help para ver os comandos disponíveis."
          )
        );
      }
    }

    // Processar callback query (cliques em botões)
    if (body.callback_query) {
      const query: TelegramCallbackQuery = body.callback_query;
      await handleCallbackQuery(query);
    }

    // Sempre retornar OK para o Telegram
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook do Telegram:");
    console.error("Erro:", error);
    if (error instanceof Error) {
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

