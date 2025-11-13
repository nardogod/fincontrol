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
  handleNaturalLanguage,
} from "@/app/lib/telegram/commands";
import type {
  TelegramMessage,
  TelegramCallbackQuery,
} from "@/app/lib/telegram/bot";

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  
  console.log("🔔 [WEBHOOK] Requisição recebida");
  console.log("🔔 [WEBHOOK] URL:", request.url);
  console.log("🔔 [WEBHOOK] Method:", request.method);
  console.log("🔔 [WEBHOOK] Headers:", {
    "content-type": request.headers.get("content-type"),
    "user-agent": request.headers.get("user-agent"),
  });

  try {
    // Verificar variáveis de ambiente
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("🔑 [WEBHOOK] TELEGRAM_BOT_TOKEN:", hasToken ? "✅ OK" : "❌ MISSING");
    console.log("🔑 [WEBHOOK] NEXT_PUBLIC_SUPABASE_URL:", hasSupabaseUrl ? "✅ OK" : "❌ MISSING");
    console.log("🔑 [WEBHOOK] SUPABASE_SERVICE_ROLE_KEY:", hasSupabaseKey ? "✅ OK" : "❌ MISSING");

    if (!hasToken) {
      console.error("❌ [WEBHOOK] TELEGRAM_BOT_TOKEN não configurado");
      console.error("Configure a variável de ambiente no Netlify");
      console.error(
        "Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env"
      );
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 500 });
    }

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error("❌ [WEBHOOK] Variáveis do Supabase não configuradas!");
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL:",
        hasSupabaseUrl ? "✅" : "❌"
      );
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY:",
        hasSupabaseKey ? "✅" : "❌"
      );
      console.error(
        "Configure no Netlify: https://app.netlify.com/sites/fincontrol-app/settings/env"
      );
      return NextResponse.json({ ok: false, error: "Missing Supabase config" }, { status: 500 });
    }

    const body = await request.json();

    console.log("📨 [WEBHOOK] Body completo:", JSON.stringify(body, null, 2));
    console.log("📨 [WEBHOOK] Update ID:", body.update_id);
    console.log("📨 [WEBHOOK] Tipo:", body.message ? "message" : body.callback_query ? "callback" : "unknown");

    if (body.message?.text) {
      console.log("💬 [WEBHOOK] Texto da mensagem:", body.message.text);
      console.log("👤 [WEBHOOK] User ID:", body.message.from.id);
      console.log("👤 [WEBHOOK] User name:", body.message.from.first_name);
      console.log("👤 [WEBHOOK] Username:", body.message.from.username || "sem username");
    }

    if (body.callback_query) {
      console.log("🔘 [WEBHOOK] Callback query data:", body.callback_query.data);
      console.log("👤 [WEBHOOK] Callback user ID:", body.callback_query.from.id);
    }

    // Verificar se é uma atualização válida
    if (!body.update_id) {
      console.log("⚠️ [WEBHOOK] Update sem update_id, ignorando");
      return NextResponse.json({ ok: true });
    }

    console.log("✅ [WEBHOOK] Processamento iniciado");

    // IMPORTANTE: Retornar 200 OK imediatamente para o Telegram
    // Processar comandos de forma assíncrona após retornar
    const responsePromise = NextResponse.json({ ok: true });

    // Processar mensagem de texto de forma assíncrona
    if (body.message?.text) {
      const message: TelegramMessage = body.message;
      const text = message.text.trim();
      const args = text.split(/\s+/).slice(1); // Remove o comando

      // Processar comandos de forma assíncrona (não bloquear resposta)
      // Usar Promise.resolve().then() para garantir execução mesmo após retornar resposta
      Promise.resolve().then(async () => {
        const commandStartTime = Date.now();
        try {
          console.log(`🔧 [WEBHOOK] Processando comando: ${text}`);
          console.log(`⏱️ [WEBHOOK] Tempo desde requisição: ${Date.now() - requestStartTime}ms`);
          console.log(`📤 [WEBHOOK] INICIANDO processamento assíncrono...`);

          if (text.startsWith("/start")) {
            console.log("✅ [WEBHOOK] Executando /start");
            const handleStartTime = Date.now();
            await handleStartCommand(message);
            const handleDuration = Date.now() - handleStartTime;
            console.log(`✅ [WEBHOOK] /start processado com sucesso em ${handleDuration}ms`);
            console.log(`⏱️ [WEBHOOK] Tempo total do comando: ${Date.now() - commandStartTime}ms`);
            console.log(`✅ [WEBHOOK] Processamento assíncrono COMPLETO`);
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
          } else if (text.startsWith("/help")) {
            console.log("✅ [WEBHOOK] Executando /help");
            await handleHelpCommand(message);
            console.log(`✅ [WEBHOOK] /help processado com sucesso`);
          } else {
            // Tentar processar como linguagem natural
            console.log("💬 [WEBHOOK] Tentando processar como linguagem natural...");
            try {
              await handleNaturalLanguage(message);
              console.log("✅ [WEBHOOK] Linguagem natural processada");
            } catch (nlError) {
              console.error("❌ [WEBHOOK] Erro em handleNaturalLanguage:", nlError);
              console.error("❌ [WEBHOOK] Stack:", nlError instanceof Error ? nlError.stack : "N/A");
              // Não lançar erro para não quebrar o webhook
            }
          }
          
          console.log(`✅ [WEBHOOK] Processamento assíncrono COMPLETO em ${Date.now() - commandStartTime}ms`);
        } catch (cmdError) {
          const errorTime = Date.now() - commandStartTime;
          console.error(`❌ [WEBHOOK] Erro ao processar comando após ${errorTime}ms:`);
          console.error("❌ [WEBHOOK] Erro:", cmdError);
          console.error("❌ [WEBHOOK] Stack:", cmdError instanceof Error ? cmdError.stack : "N/A");
          
          // Tentar enviar mensagem de erro ao usuário
          try {
            console.log(`📤 [WEBHOOK] Tentando enviar mensagem de erro ao usuário...`);
            const { sendMessage } = await import("@/app/lib/telegram/bot");
            await sendMessage(
              message.chat.id,
              "❌ Desculpe, ocorreu um erro ao processar seu comando. Tente novamente."
            );
            console.log(`✅ [WEBHOOK] Mensagem de erro enviada com sucesso`);
          } catch (sendError) {
            console.error("❌ [WEBHOOK] Erro ao enviar mensagem de erro:", sendError);
            console.error("❌ [WEBHOOK] Stack do erro de envio:", sendError instanceof Error ? sendError.stack : "N/A");
          }
        }
      });
    }

    // Processar callback query (cliques em botões) de forma assíncrona
    if (body.callback_query) {
      const query: TelegramCallbackQuery = body.callback_query;
      Promise.resolve().then(async () => {
        try {
          console.log("🔘 [WEBHOOK] Processando callback query");
          console.log("📤 [WEBHOOK] INICIANDO processamento assíncrono de callback...");
          await handleCallbackQuery(query);
          console.log("✅ [WEBHOOK] Callback query processado");
          console.log("✅ [WEBHOOK] Processamento assíncrono de callback COMPLETO");
        } catch (callbackError) {
          console.error("❌ [WEBHOOK] Erro em handleCallbackQuery:", callbackError);
          console.error("❌ [WEBHOOK] Stack:", callbackError instanceof Error ? callbackError.stack : "N/A");
        }
      });
    }

    // Retornar OK imediatamente para o Telegram
    const responseTime = Date.now() - requestStartTime;
    console.log(`✅ [WEBHOOK] Retornando 200 OK para Telegram após ${responseTime}ms`);
    return responsePromise;
  } catch (error) {
    console.error("❌ [WEBHOOK] Erro ao processar webhook do Telegram:");
    console.error("❌ [WEBHOOK] Erro:", error);
    if (error instanceof Error) {
      console.error("❌ [WEBHOOK] Mensagem:", error.message);
      console.error("❌ [WEBHOOK] Stack:", error.stack);
    } else {
      console.error("❌ [WEBHOOK] Erro não é instância de Error:", JSON.stringify(error));
    }
    // IMPORTANTE: Sempre retornar OK para o Telegram
    // Se retornar erro, o Telegram vai tentar reenviar e pode causar loops
    return NextResponse.json({ ok: true });
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
