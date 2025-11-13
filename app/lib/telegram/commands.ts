/**
 * Telegram Bot Commands
 * Processamento de comandos e lógica de negócio
 */

import { createClient } from "@supabase/supabase-js";
import type { TCategory, TAccount } from "@/app/lib/types";
import {
  sendMessage,
  editMessage,
  answerCallbackQuery,
  formatCurrencyForTelegram,
  type TelegramMessage,
  type TelegramCallbackQuery,
  type InlineKeyboardButton,
} from "./bot";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TelegramSession {
  type: "expense" | "income";
  amount?: number;
  category_id?: string;
  account_id?: string;
  description?: string;
  message_id?: number;
}

/**
 * Comando /start - Boas-vindas e autenticação
 */
export async function handleStartCommand(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  // Verificar se usuário já está vinculado
  const { data: link } = await supabase
    .from("user_telegram_links")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();

  if (link) {
    await sendMessage(
      chatId,
      `✅ *Bem-vindo de volta!*\n\n` +
        `Você já está conectado ao FinControl.\n\n` +
        `*Comandos disponíveis:*\n` +
        `/gasto - Registrar uma despesa\n` +
        `/receita - Registrar uma receita\n` +
        `/contas - Ver suas contas\n` +
        `/hoje - Resumo do dia\n` +
        `/mes - Resumo do mês\n` +
        `/help - Ver todos os comandos`,
      { parse_mode: "Markdown" }
    );
  } else {
    // Gerar token de autenticação
    const authToken = generateAuthToken();

    // Salvar token temporário
    await supabase.from("telegram_auth_tokens").insert({
      telegram_id: telegramId,
      token: authToken,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
    });

    // Usar URL do ambiente ou fallback
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://fincontrol-app.netlify.app";
    const authUrl = `${appUrl}/telegram/auth?token=${authToken}`;

    // Log para debug (remover em produção se necessário)
    console.log(`🔗 Gerando URL de autenticação: ${authUrl}`);

    await sendMessage(
      chatId,
      `👋 *Olá! Bem-vindo ao FinControl Bot*\n\n` +
        `Para começar a usar, você precisa vincular sua conta.\n\n` +
        `🔗 *Clique no botão abaixo para autenticar:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔐 Conectar Conta", url: authUrl }]],
        },
      }
    );
  }
}

/**
 * Comando /gasto - Registrar despesa
 */
export async function handleExpenseCommand(
  message: TelegramMessage,
  args: string[]
) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  // Verificar autenticação
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendMessage(
      chatId,
      "❌ Você precisa se autenticar primeiro. Use /start"
    );
    return;
  }

  // Processar argumentos: /gasto 100 alimentacao supermercado
  const amount = args[0] ? parseFloat(args[0]) : null;
  const categoryName = args[1]?.toLowerCase();
  const description = args.slice(2).join(" ") || null;

  if (!amount || isNaN(amount)) {
    await sendMessage(
      chatId,
      "💰 *Registrar Despesa*\n\n" +
        "Por favor, informe o valor:\n" +
        "Exemplo: `/gasto 50` ou `/gasto 50 alimentacao mercado`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Criar sessão temporária
  const session: TelegramSession = {
    type: "expense",
    amount,
    description,
  };

  // Se categoria foi fornecida, tentar encontrar
  if (categoryName) {
    // Buscar contas do usuário para filtrar categorias
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("is_active", true);

    const accountIds = accounts?.map((a) => a.id) || [];

    let query = supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .ilike("name", `%${categoryName}%`);

    if (accountIds.length > 0) {
      query = query.or(
        `is_default.eq.true,account_id.in.(${accountIds.join(",")})`
      );
    } else {
      query = query.eq("is_default", true);
    }

    const { data: categories } = await query;

    if (categories && categories.length > 0) {
      session.category_id = categories[0].id;
    }
  }

  // Salvar sessão
  await saveSession(telegramId, session);

  // Se não tem categoria, pedir
  if (!session.category_id) {
    await askForCategory(chatId, telegramId, "expense");
  } else {
    // Se tem categoria, pedir conta
    await askForAccount(chatId, telegramId);
  }
}

/**
 * Comando /receita - Registrar receita
 */
export async function handleIncomeCommand(
  message: TelegramMessage,
  args: string[]
) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendMessage(
      chatId,
      "❌ Você precisa se autenticar primeiro. Use /start"
    );
    return;
  }

  const amount = args[0] ? parseFloat(args[0]) : null;
  const description = args.slice(1).join(" ") || null;

  if (!amount || isNaN(amount)) {
    await sendMessage(
      chatId,
      "💵 *Registrar Receita*\n\n" +
        "Por favor, informe o valor:\n" +
        "Exemplo: `/receita 5000` ou `/receita 5000 salario`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const session: TelegramSession = {
    type: "income",
    amount,
    description,
  };

  await saveSession(telegramId, session);
  await askForCategory(chatId, telegramId, "income");
}

/**
 * Pergunta qual categoria
 */
async function askForCategory(
  chatId: number,
  telegramId: number,
  type: "expense" | "income"
) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  // Buscar contas do usuário para filtrar categorias
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.user_id)
    .eq("is_active", true);

  const accountIds = accounts?.map((a) => a.id) || [];

  // Buscar categorias: padrões OU das contas do usuário
  let query = supabase.from("categories").select("*").eq("type", type);

  if (accountIds.length > 0) {
    query = query.or(
      `is_default.eq.true,account_id.in.(${accountIds.join(",")})`
    );
  } else {
    query = query.eq("is_default", true);
  }

  const { data: categories } = await query.order("name");

  if (!categories || categories.length === 0) {
    await sendMessage(chatId, "❌ Nenhuma categoria encontrada.");
    return;
  }

  // Criar botões (máximo 8 por linha, 2 colunas)
  const buttons: InlineKeyboardButton[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row: InlineKeyboardButton[] = [];
    row.push({
      text: `${categories[i].icon} ${categories[i].name}`,
      callback_data: `cat_${categories[i].id}`,
    });
    if (i + 1 < categories.length) {
      row.push({
        text: `${categories[i + 1].icon} ${categories[i + 1].name}`,
        callback_data: `cat_${categories[i + 1].id}`,
      });
    }
    buttons.push(row);
  }

  // Botão de cancelar
  buttons.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

  const sent = await sendMessage(chatId, "🏷️ *Selecione a categoria:*", {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: buttons },
  });

  // Atualizar sessão com message_id
  const session = await getSession(telegramId);
  if (session) {
    session.message_id = sent.result.message_id;
    await saveSession(telegramId, session);
  }
}

/**
 * Pergunta qual conta
 */
async function askForAccount(chatId: number, telegramId: number) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.user_id)
    .eq("is_active", true)
    .order("name");

  if (!accounts || accounts.length === 0) {
    await sendMessage(chatId, "❌ Nenhuma conta encontrada.");
    return;
  }

  const buttons: InlineKeyboardButton[][] = accounts.map((account) => [
    {
      text: `${account.name}`,
      callback_data: `acc_${account.id}`,
    },
  ]);

  buttons.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

  const session = await getSession(telegramId);
  const messageId = session?.message_id;

  if (messageId) {
    await editMessage(chatId, messageId, "🏦 *Selecione a conta:*", {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  } else {
    await sendMessage(chatId, "🏦 *Selecione a conta:*", {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  }
}

/**
 * Processa callback queries (cliques em botões)
 */
export async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const telegramId = query.from.id;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  await answerCallbackQuery(query.id);

  if (data === "cancel") {
    await clearSession(telegramId);
    await editMessage(chatId, messageId, "❌ Operação cancelada.");
    return;
  }

  const session = await getSession(telegramId);
  if (!session) {
    await sendMessage(chatId, "❌ Sessão expirada. Tente novamente.");
    return;
  }

  // Categoria selecionada
  if (data.startsWith("cat_")) {
    const categoryId = data.replace("cat_", "");
    session.category_id = categoryId;
    await saveSession(telegramId, session);
    await askForAccount(chatId, telegramId);
    return;
  }

  // Conta selecionada - finalizar transação
  if (data.startsWith("acc_")) {
    const accountId = data.replace("acc_", "");
    session.account_id = accountId;

    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    // Inserir transação
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.user_id,
        account_id: session.account_id,
        type: session.type,
        amount: session.amount,
        category_id: session.category_id,
        description: session.description,
        transaction_date: new Date().toISOString().split("T")[0],
        created_via: "api",
      })
      .select()
      .single();

    if (error) {
      await editMessage(
        chatId,
        messageId,
        `❌ Erro ao criar transação: ${error.message}`
      );
      return;
    }

    // Buscar dados completos para confirmação
    const { data: category } = await supabase
      .from("categories")
      .select("name, icon")
      .eq("id", session.category_id)
      .single();

    const { data: account } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", session.account_id)
      .single();

    const icon = session.type === "expense" ? "💸" : "💰";
    const typeText = session.type === "expense" ? "Despesa" : "Receita";

    await editMessage(
      chatId,
      messageId,
      `✅ *${typeText} registrada com sucesso!*\n\n` +
        `${icon} ${formatCurrencyForTelegram(session.amount || 0, "kr")}\n` +
        `${category?.icon || "🏷️"} ${category?.name || "Sem categoria"}\n` +
        `🏦 ${account?.name || "Conta"}\n` +
        `${session.description ? `📝 ${session.description}\n` : ""}` +
        `📅 ${new Date().toLocaleDateString("pt-BR")}`,
      { parse_mode: "Markdown" }
    );

    await clearSession(telegramId);
  }
}

/**
 * Comando /contas - Listar contas do usuário
 */
export async function handleAccountsCommand(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  console.log(`📋 Comando /contas recebido de Telegram ID: ${telegramId}`);

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    console.log(`❌ Usuário não encontrado para Telegram ID: ${telegramId}`);
    await sendMessage(
      chatId,
      "❌ Você precisa se autenticar primeiro. Use /start"
    );
    return;
  }

  console.log(`🔍 Buscando contas para user_id: ${user.user_id}`);
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.user_id)
    .eq("is_active", true)
    .order("name");

  if (accountsError) {
    console.error(`❌ Erro ao buscar contas:`, accountsError);
    await sendMessage(
      chatId,
      `❌ Erro ao buscar contas: ${accountsError.message}`
    );
    return;
  }

  console.log(`📊 Contas encontradas: ${accounts?.length || 0}`);

  if (!accounts || accounts.length === 0) {
    console.log(`⚠️ Nenhuma conta encontrada para user_id: ${user.user_id}`);
    await sendMessage(
      chatId,
      "❌ Nenhuma conta encontrada.\n\n💡 Crie uma conta primeiro no site: https://fincontrol-app.netlify.app/accounts"
    );
    return;
  }

  let messageText = "🏦 *Suas Contas:*\n\n";
  accounts.forEach((account, index) => {
    messageText += `${index + 1}. ${account.icon || "🏦"} ${account.name}\n`;
  });

  await sendMessage(chatId, messageText, { parse_mode: "Markdown" });
}

/**
 * Comando /hoje - Resumo do dia
 */
export async function handleTodayCommand(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendMessage(
      chatId,
      "❌ Você precisa se autenticar primeiro. Use /start"
    );
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // Buscar contas do usuário
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.user_id)
    .eq("is_active", true);

  const accountIds = accounts?.map((a) => a.id) || [];

  if (accountIds.length === 0) {
    await sendMessage(chatId, "❌ Nenhuma conta encontrada.");
    return;
  }

  // Buscar transações do dia
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .in("account_id", accountIds)
    .eq("transaction_date", today);

  if (!transactions || transactions.length === 0) {
    await sendMessage(
      chatId,
      `📅 *Resumo de Hoje*\n\nNenhuma transação registrada hoje.`
    );
    return;
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expense;

  const messageText =
    `📅 *Resumo de Hoje*\n\n` +
    `💰 Receitas: ${formatCurrencyForTelegram(income)}\n` +
    `💸 Despesas: ${formatCurrencyForTelegram(expense)}\n` +
    `━━━━━━━━━━━━━━\n` +
    `💵 Saldo: ${formatCurrencyForTelegram(balance)}\n\n` +
    `📊 Total de transações: ${transactions.length}`;

  await sendMessage(chatId, messageText, { parse_mode: "Markdown" });
}

/**
 * Comando /mes - Resumo do mês
 */
export async function handleMonthCommand(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendMessage(
      chatId,
      "❌ Você precisa se autenticar primeiro. Use /start"
    );
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // Buscar contas do usuário
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.user_id)
    .eq("is_active", true);

  const accountIds = accounts?.map((a) => a.id) || [];

  if (accountIds.length === 0) {
    await sendMessage(chatId, "❌ Nenhuma conta encontrada.");
    return;
  }

  // Buscar transações do mês
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount")
    .in("account_id", accountIds)
    .gte("transaction_date", monthStart)
    .lte("transaction_date", monthEnd);

  if (!transactions || transactions.length === 0) {
    const monthName = now.toLocaleDateString("pt-BR", { month: "long" });
    await sendMessage(
      chatId,
      `📅 *Resumo de ${monthName}*\n\nNenhuma transação registrada este mês.`
    );
    return;
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expense;

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });
  const messageText =
    `📅 *Resumo de ${monthName}*\n\n` +
    `💰 Receitas: ${formatCurrencyForTelegram(income)}\n` +
    `💸 Despesas: ${formatCurrencyForTelegram(expense)}\n` +
    `━━━━━━━━━━━━━━\n` +
    `💵 Saldo: ${formatCurrencyForTelegram(balance)}\n\n` +
    `📊 Total de transações: ${transactions.length}`;

  await sendMessage(chatId, messageText, { parse_mode: "Markdown" });
}

/**
 * Comando /help - Ajuda
 */
export async function handleHelpCommand(message: TelegramMessage) {
  const chatId = message.chat.id;

  const helpText =
    `📖 *Comandos do FinControl Bot*\n\n` +
    `/start - Iniciar bot e vincular conta\n` +
    `/gasto [valor] [categoria] [descrição] - Registrar despesa\n` +
    `/receita [valor] [descrição] - Registrar receita\n` +
    `/contas - Ver suas contas\n` +
    `/hoje - Resumo do dia\n` +
    `/mes - Resumo do mês\n` +
    `/help - Ver esta ajuda\n\n` +
    `*Exemplos:*\n` +
    `• /gasto 50\n` +
    `• /gasto 50 alimentacao mercado\n` +
    `• /receita 5000 salario`;

  await sendMessage(chatId, helpText, { parse_mode: "Markdown" });
}

/**
 * Helpers
 */

async function getUserByTelegramId(telegramId: number) {
  console.log(`🔍 Buscando usuário para Telegram ID: ${telegramId}`);

  const { data, error } = await supabase
    .from("user_telegram_links")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(`❌ Erro ao buscar usuário:`, error);
    return null;
  }

  if (!data) {
    console.log(`⚠️ Nenhum link encontrado para Telegram ID: ${telegramId}`);
    return null;
  }

  console.log(`✅ Usuário encontrado: user_id = ${data.user_id}`);
  return data;
}

async function saveSession(telegramId: number, session: TelegramSession) {
  // Deletar sessões antigas
  await supabase
    .from("telegram_sessions")
    .delete()
    .eq("telegram_id", telegramId);

  // Criar nova sessão (expira em 10 minutos)
  await supabase.from("telegram_sessions").insert({
    telegram_id: telegramId,
    session_data: session,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
}

async function getSession(telegramId: number): Promise<TelegramSession | null> {
  const { data } = await supabase
    .from("telegram_sessions")
    .select("session_data")
    .eq("telegram_id", telegramId)
    .gt("expires_at", new Date().toISOString())
    .single();

  return data?.session_data || null;
}

async function clearSession(telegramId: number) {
  await supabase
    .from("telegram_sessions")
    .delete()
    .eq("telegram_id", telegramId);
}

function generateAuthToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
