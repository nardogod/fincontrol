/**
 * Telegram Bot Utilities
 * Funções auxiliares para interagir com a API do Telegram
 */

function getTelegramApiUrl(): string {
  console.log(`🔍 [TELEGRAM] getTelegramApiUrl chamado`);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  console.log(`🔍 [TELEGRAM] Token existe: ${!!token}`);
  console.log(`🔍 [TELEGRAM] Token length: ${token ? token.length : 0}`);
  if (!token) {
    console.error(`❌ [TELEGRAM] TELEGRAM_BOT_TOKEN não configurado!`);
    throw new Error("TELEGRAM_BOT_TOKEN não configurado");
  }
  const url = `https://api.telegram.org/bot${token}`;
  console.log(`🔍 [TELEGRAM] URL gerada: ${url.substring(0, 30)}...`);
  return url;
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  date: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  message: TelegramMessage;
  data: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

/**
 * Envia uma mensagem de texto
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    reply_markup?: {
      inline_keyboard?: InlineKeyboardButton[][];
      remove_keyboard?: boolean;
    };
    parse_mode?: "Markdown" | "HTML";
  }
): Promise<any> {
  const startTime = Date.now();

  // TIMEOUT de 10 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(
      `⏱️ [TELEGRAM] TIMEOUT: Abortando requisição após 10 segundos`
    );
    controller.abort();
  }, 10000);

  try {
    const url = `${getTelegramApiUrl()}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      ...options,
    };

    console.log(`📤 [TELEGRAM] ENVIANDO mensagem para API`);
    console.log(`📤 [TELEGRAM] URL: ${url}`);
    console.log(`📤 [TELEGRAM] Chat ID: ${chatId}`);
    console.log(`📤 [TELEGRAM] Text length: ${text.length}`);

    try {
      console.log(`📤 [TELEGRAM] Serializando body...`);
      const bodyString = JSON.stringify(body);
      console.log(
        `📤 [TELEGRAM] Body serializado, length: ${bodyString.length}`
      );
    } catch (stringifyError) {
      console.error(`❌ [TELEGRAM] Erro ao serializar body:`, stringifyError);
      throw stringifyError;
    }

    console.log(`📤 [TELEGRAM] ANTES do fetch...`);
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal, // Adicionar signal para timeout
    });

    clearTimeout(timeoutId);

    const fetchTime = Date.now() - fetchStartTime;
    console.log(`⏱️ [TELEGRAM] Fetch completado em ${fetchTime}ms`);
    console.log(
      `📥 [TELEGRAM] Status HTTP: ${response.status} ${response.statusText}`
    );

    const result = await response.json();
    const totalTime = Date.now() - startTime;

    console.log(`📥 [TELEGRAM] RESPOSTA recebida em ${totalTime}ms`);
    console.log(`📥 [TELEGRAM] Result OK: ${result?.ok ? "✅ SIM" : "❌ NÃO"}`);
    console.log(
      `📥 [TELEGRAM] Result completo:`,
      JSON.stringify(result, null, 2)
    );

    if (!result.ok) {
      console.error(`❌ [TELEGRAM] Erro na API do Telegram:`);
      console.error(`❌ [TELEGRAM] Error code: ${result.error_code}`);
      console.error(`❌ [TELEGRAM] Description: ${result.description}`);
      console.error(`❌ [TELEGRAM] Full error:`, result);
      throw new Error(
        `Telegram API error: ${result.description || "Unknown error"}`
      );
    }

    console.log(`✅ [TELEGRAM] Mensagem enviada com sucesso!`);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    const totalTime = Date.now() - startTime;

    if (error instanceof Error && error.name === "AbortError") {
      console.error(`❌ [TELEGRAM] TIMEOUT após 5 segundos!`);
      console.error(`❌ [TELEGRAM] Requisição abortada por timeout`);
      throw new Error(
        "Telegram API timeout: requisição demorou mais de 5 segundos"
      );
    }

    console.error(
      `❌ [TELEGRAM] Erro ao chamar Telegram API após ${totalTime}ms`
    );
    console.error(`❌ [TELEGRAM] Erro:`, error);
    if (error instanceof Error) {
      console.error(`❌ [TELEGRAM] Mensagem: ${error.message}`);
      console.error(`❌ [TELEGRAM] Stack: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * Edita uma mensagem existente
 */
export async function editMessage(
  chatId: number,
  messageId: number,
  text: string,
  options?: {
    reply_markup?: {
      inline_keyboard?: InlineKeyboardButton[][];
    };
    parse_mode?: "Markdown" | "HTML";
  }
): Promise<any> {
  const startTime = Date.now();

  try {
    const url = `${getTelegramApiUrl()}/editMessageText`;
    console.log(
      `📤 [TELEGRAM] Editando mensagem ${messageId} no chat ${chatId}`
    );

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        ...options,
      }),
    });

    const result = await response.json();
    const totalTime = Date.now() - startTime;

    console.log(`📥 [TELEGRAM] Edição completada em ${totalTime}ms`);
    console.log(`📥 [TELEGRAM] Result OK: ${result?.ok ? "✅ SIM" : "❌ NÃO"}`);

    if (!result.ok) {
      console.error(`❌ [TELEGRAM] Erro ao editar mensagem:`, result);
    }

    return result;
  } catch (error) {
    console.error(`❌ [TELEGRAM] Erro ao editar mensagem:`, error);
    throw error;
  }
}

/**
 * Responde a um callback query (quando usuário clica em botão)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<any> {
  try {
    const url = `${getTelegramApiUrl()}/answerCallbackQuery`;
    console.log(`📤 [TELEGRAM] Respondendo callback query ${callbackQueryId}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });

    const result = await response.json();
    console.log(
      `📥 [TELEGRAM] Callback query respondido: ${result?.ok ? "✅" : "❌"}`
    );

    return result;
  } catch (error) {
    console.error(`❌ [TELEGRAM] Erro ao responder callback query:`, error);
    throw error;
  }
}

/**
 * Define os comandos do bot (aparece no menu do Telegram)
 */
export async function setMyCommands(
  commands: Array<{ command: string; description: string }>
): Promise<any> {
  const response = await fetch(`${getTelegramApiUrl()}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands }),
  });

  return response.json();
}

/**
 * Define o webhook
 */
export async function setWebhook(url: string): Promise<any> {
  const response = await fetch(`${getTelegramApiUrl()}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return response.json();
}

/**
 * Remove o webhook
 */
export async function deleteWebhook(): Promise<any> {
  const response = await fetch(`${getTelegramApiUrl()}/deleteWebhook`, {
    method: "POST",
  });

  return response.json();
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrencyForTelegram(
  amount: number,
  currency: string = "kr"
): string {
  return `${amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Gera link de autenticação único
 */
export function generateAuthLink(token: string, baseUrl: string): string {
  return `${baseUrl}/telegram/auth?token=${token}`;
}
