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
      console.error(
        "❌ [WEBHOOK] Environment check failed: TELEGRAM_BOT_TOKEN missing"
      );
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 500 }
      );
    }

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error("❌ [WEBHOOK] Variáveis do Supabase não configuradas!");
      console.error(
        "❌ [WEBHOOK] Environment check failed: Supabase variables missing"
      );
      console.error(
        `❌ [WEBHOOK] NEXT_PUBLIC_SUPABASE_URL: ${
          hasSupabaseUrl ? "OK" : "MISSING"
        }`
      );
      console.error(
        `❌ [WEBHOOK] SUPABASE_SERVICE_ROLE_KEY: ${
          hasSupabaseKey ? "OK" : "MISSING"
        }`
      );
      return NextResponse.json(
        { ok: false, error: "Missing Supabase config" },
        { status: 500 }
      );
    }

    console.log("✅ [WEBHOOK] Environment variables OK");
    console.log(
      `✅ [WEBHOOK] TELEGRAM_BOT_TOKEN: ${hasToken ? "configured" : "missing"}`
    );
    console.log(
      `✅ [WEBHOOK] SUPABASE_URL: ${hasSupabaseUrl ? "configured" : "missing"}`
    );
    console.log(
      `✅ [WEBHOOK] SUPABASE_KEY: ${hasSupabaseKey ? "configured" : "missing"}`
    );

    const body = await request.json();

    // Verificar se é uma atualização válida
    if (!body.update_id) {
      console.log("⚠️ [WEBHOOK] Update sem update_id, ignorando");
      return NextResponse.json({ ok: true });
    }

    // Processar mensagem de texto ANTES de retornar resposta
    if (body.message?.text) {
      const message: TelegramMessage = body.message;
      const text = message.text?.trim() || "";
      const args = text.split(/\s+/).slice(1); // Remove o comando

      console.log(`📨 [WEBHOOK] Processando comando: ${text}`);

      try {
        if (text.startsWith("/start")) {
          console.log("✅ [WEBHOOK] Executando /start");
          await handleStartCommand(message);
          console.log(`✅ [WEBHOOK] /start processado com sucesso`);
        } else if (text.startsWith("/gasto")) {
          console.log("✅ [WEBHOOK] Executando /gasto");
          await handleExpenseCommand(message, args);
          console.log(`✅ [WEBHOOK] /gasto processado com sucesso`);
        } else if (text.startsWith("/receita")) {
          console.log("✅ [WEBHOOK] Executando /receita");
          await handleIncomeCommand(message, args);
          console.log(`✅ [WEBHOOK] /receita processado com sucesso`);
        } else if (text.startsWith("/contas")) {
          console.log("✅ [WEBHOOK] Executando /contas");
          await handleAccountsCommand(message);
          console.log(`✅ [WEBHOOK] /contas processado com sucesso`);
        } else if (text.startsWith("/hoje")) {
          console.log("✅ [WEBHOOK] Executando /hoje");
          await handleTodayCommand(message);
          console.log(`✅ [WEBHOOK] /hoje processado com sucesso`);
        } else if (text.startsWith("/mes")) {
          console.log("✅ [WEBHOOK] Executando /mes");
          await handleMonthCommand(message);
          console.log(`✅ [WEBHOOK] /mes processado com sucesso`);
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
          console.log("✅ [WEBHOOK] Executando /help");
          await handleHelpCommand(message);
          console.log(`✅ [WEBHOOK] /help processado com sucesso`);
        } else if (text.startsWith("/")) {
          // Comando desconhecido
          console.log(`⚠️ [WEBHOOK] Comando desconhecido: ${text}`);
          await sendMessage(
            message.chat.id,
            `❓ Comando não reconhecido: ${text}\n\n` +
              `Use /help para ver todos os comandos disponíveis.`
          );
        } else {
          // Tentar processar como linguagem natural
          console.log("✅ [WEBHOOK] Processando linguagem natural");
          await handleNaturalLanguage(message);
          console.log(`✅ [WEBHOOK] Linguagem natural processada com sucesso`);
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
    }

    // Processar callback query (cliques em botões) ANTES de retornar resposta
    if (body.callback_query) {
      const query: TelegramCallbackQuery = body.callback_query;
      console.log(`🔘 [WEBHOOK] Processando callback: ${query.data}`);
      try {
        await handleCallbackQuery(query);
        console.log(`✅ [WEBHOOK] Callback processado com sucesso`);
      } catch (callbackError) {
        console.error(
          "❌ [WEBHOOK] Erro em handleCallbackQuery:",
          callbackError
        );
      }
    }

    // Retornar OK após processar tudo
    return NextResponse.json({ ok: true });
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
