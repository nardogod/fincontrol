/**
 * Telegram Bot Utilities
 * Funções auxiliares para interagir com a API do Telegram
 */

function getTelegramApiUrl(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN não configurado");
  }
  return `https://api.telegram.org/bot${token}`;
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
  const response = await fetch(`${getTelegramApiUrl()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...options,
    }),
  });

  return response.json();
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
  const response = await fetch(`${getTelegramApiUrl()}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    }),
  });

  return response.json();
}

/**
 * Responde a um callback query (quando usuário clica em botão)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<any> {
  const response = await fetch(`${getTelegramApiUrl()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    }),
  });

  return response.json();
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

