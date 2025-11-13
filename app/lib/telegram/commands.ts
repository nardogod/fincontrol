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

// Verificar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis do Supabase não configuradas!");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✅" : "❌");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

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
  const startTime = Date.now();
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  console.log(`🔧 [COMMANDS] handleStartCommand iniciado`);
  console.log(`🔧 [COMMANDS] Telegram ID: ${telegramId}, Chat ID: ${chatId}`);

  // Verificar se usuário já está vinculado
  console.log(`🔍 [COMMANDS] Buscando link do usuário...`);
  const { data: link } = await supabase
    .from("user_telegram_links")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();

  if (link) {
    console.log(`✅ [COMMANDS] Usuário já vinculado: ${link.user_id}`);
    // Usar nome do Telegram para personalização
    const userName = message.from.first_name || "Usuário";
    const userFullName = userName;

    // Verificar se há sessões pendentes
    const { data: pendingSessions } = await supabase
      .from("telegram_sessions")
      .select("*")
      .eq("telegram_id", telegramId)
      .gt("expires_at", new Date().toISOString());

    // Buscar categorias mais usadas para atalhos
    const accounts = await getUserAccounts(link.user_id);
    const accountIds = accounts.map((a: any) => a.id);

    let categoriesQuery = supabase
      .from("categories")
      .select("id, name, icon, type");

    if (accountIds.length > 0) {
      categoriesQuery = categoriesQuery.or(
        `is_default.eq.true,account_id.in.(${accountIds.join(",")})`
      );
    } else {
      categoriesQuery = categoriesQuery.eq("is_default", true);
    }

    const { data: categories } = await categoriesQuery;

    // Buscar transações recentes para identificar categorias mais usadas
    const { data: recentTransactions } = await supabase
      .from("transactions")
      .select("category_id")
      .in("account_id", accountIds)
      .gte(
        "transaction_date",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .limit(50);

    // Contar frequência de categorias
    const categoryCounts: { [key: string]: number } = {};
    recentTransactions?.forEach((t) => {
      if (t.category_id) {
        categoryCounts[t.category_id] =
          (categoryCounts[t.category_id] || 0) + 1;
      }
    });

    // Pegar top 4 categorias mais usadas
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => categories?.find((c) => c.id === id))
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      icon: string;
      type: string;
    }>;

    // Se não tem histórico, usar categorias padrão mais comuns
    if (topCategories.length === 0 && categories) {
      const commonCategories = [
        "Alimentação",
        "Transporte",
        "Moradia",
        "Lazer",
      ];
      topCategories.push(
        ...categories
          .filter((c) => commonCategories.includes(c.name))
          .slice(0, 4)
      );
    }

    // Criar botões de atalho
    const quickButtons: InlineKeyboardButton[][] = [];
    if (topCategories.length > 0) {
      const expenseCategories = topCategories
        .filter((c) => c.type === "expense")
        .slice(0, 2);
      const incomeCategories = topCategories
        .filter((c) => c.type === "income")
        .slice(0, 2);

      if (expenseCategories.length > 0) {
        quickButtons.push(
          expenseCategories.map((cat) => ({
            text: `${cat.icon || "💸"} ${cat.name}`,
            callback_data: `quick_expense_${cat.id}`,
          }))
        );
      }

      if (incomeCategories.length > 0) {
        quickButtons.push(
          incomeCategories.map((cat) => ({
            text: `${cat.icon || "💰"} ${cat.name}`,
            callback_data: `quick_income_${cat.id}`,
          }))
        );
      }
    }

    let welcomeMessage = `👋 *Olá, ${userFullName}!*\n\n`;
    welcomeMessage += `✅ Você está conectado ao FinControl.\n\n`;

    if (pendingSessions && pendingSessions.length > 0) {
      welcomeMessage += `⏰ *Você tem ${pendingSessions.length} transação(ões) pendente(s)*\n`;
      welcomeMessage += `Complete-as ou envie uma nova mensagem para começar.\n\n`;
    }

    welcomeMessage += `*Comandos disponíveis:*\n`;
    welcomeMessage += `💸 /gasto - Registrar despesa\n`;
    welcomeMessage += `💰 /receita - Registrar receita\n`;
    welcomeMessage += `🏦 /contas - Ver suas contas\n`;
    welcomeMessage += `📅 /hoje - Resumo do dia\n`;
    welcomeMessage += `📊 /mes - Resumo do mês\n`;
    welcomeMessage += `❓ /help - Ver ajuda completa\n\n`;

    if (topCategories.length > 0) {
      welcomeMessage += `⚡ *Atalhos rápidos:*\n`;
      welcomeMessage += `Clique nos botões abaixo para registrar rapidamente:\n`;
    }

    console.log(`📤 [COMMANDS] Preparando para enviar mensagem de boas-vindas`);
    console.log(`📤 [COMMANDS] Mensagem length: ${welcomeMessage.length}`);
    console.log(`📤 [COMMANDS] Quick buttons: ${quickButtons.length > 0 ? quickButtons.length : 0}`);
    
    const sendStartTime = Date.now();
    await sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
      reply_markup:
        quickButtons.length > 0
          ? {
              inline_keyboard: quickButtons,
            }
          : undefined,
    });
    const sendDuration = Date.now() - sendStartTime;
    console.log(`✅ [COMMANDS] Mensagem de boas-vindas enviada em ${sendDuration}ms`);
    console.log(`⏱️ [COMMANDS] Tempo total do handleStartCommand: ${Date.now() - startTime}ms`);
  } else {
    console.log(`⚠️ [COMMANDS] Usuário não vinculado, gerando token de autenticação`);
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
    console.log(`🔗 [COMMANDS] Gerando URL de autenticação: ${authUrl}`);
    console.log(`📤 [COMMANDS] Preparando para enviar mensagem de autenticação`);

    const sendAuthStartTime = Date.now();
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
    const sendAuthDuration = Date.now() - sendAuthStartTime;
    console.log(`✅ [COMMANDS] Mensagem de autenticação enviada em ${sendAuthDuration}ms`);
    console.log(`⏱️ [COMMANDS] Tempo total do handleStartCommand (não vinculado): ${Date.now() - startTime}ms`);
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
      "🔐 *Autenticação necessária*\n\n" +
        "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
        "👉 Use /start para começar"
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
    // Buscar contas do usuário (próprias + compartilhadas) para filtrar categorias
    const accounts = await getUserAccounts(user.user_id);
    const accountIds = accounts.map((a: any) => a.id);

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
      "🔐 *Autenticação necessária*\n\n" +
        "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
        "👉 Use /start para começar"
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

  // Buscar contas do usuário (próprias + compartilhadas) para filtrar categorias
  const accounts = await getUserAccounts(user.user_id);
  const accountIds = accounts.map((a: any) => a.id);

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
    await sendMessage(
      chatId,
      "📭 *Nenhuma categoria encontrada*\n\n" +
        "Você precisa criar categorias primeiro.\n\n" +
        "💡 Acesse o site para configurar suas categorias."
    );
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

  // Buscar contas (próprias + compartilhadas)
  const accounts = await getUserAccounts(user.user_id);

  // Ordenar por nome
  accounts.sort((a: any, b: any) => a.name.localeCompare(b.name));

  if (!accounts || accounts.length === 0) {
    await sendMessage(
      chatId,
      "📭 *Nenhuma conta encontrada*\n\n" +
        "Você precisa criar pelo menos uma conta primeiro.\n\n" +
        "💡 Acesse: fincontrol-app.netlify.app/accounts"
    );
    return;
  }

  const buttons: InlineKeyboardButton[][] = accounts.map((account: any) => [
    {
      text: `${account.name}${account.is_shared ? " (compartilhada)" : ""}`,
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
    await editMessage(
      chatId,
      messageId,
      "❌ *Operação cancelada*\n\n" +
        "Nenhuma transação foi registrada.\n\n" +
        "💡 Você pode tentar novamente quando quiser!"
    );
    return;
  }

  // Atalhos rápidos para categorias mais usadas
  if (data.startsWith("quick_expense_") || data.startsWith("quick_income_")) {
    const isExpense = data.startsWith("quick_expense_");
    const categoryId = data.replace(
      isExpense ? "quick_expense_" : "quick_income_",
      ""
    );

    await answerCallbackQuery(
      query.id,
      "💡 Envie o valor e a conta. Ex: 50 conta pessoal"
    );

    // Salvar categoria selecionada em sessão temporária
    const session: TelegramSession = {
      type: isExpense ? "expense" : "income",
      category_id: categoryId,
    };
    await saveSession(telegramId, session);

    // Buscar nome da categoria
    const { data: category } = await supabase
      .from("categories")
      .select("name, icon")
      .eq("id", categoryId)
      .single();

    const categoryName = category?.name || "Categoria";
    const categoryIcon = category?.icon || (isExpense ? "💸" : "💰");

    await editMessage(
      chatId,
      messageId,
      `⚡ *Atalho rápido: ${categoryIcon} ${categoryName}*\n\n` +
        `Agora envie o valor e a conta.\n\n` +
        `*Exemplos:*\n` +
        `• "50 conta pessoal"\n` +
        `• "100 mercado conta casa"\n` +
        `• "25 transporte conta role"\n\n` +
        `💡 Ou use /gasto ou /receita para começar do zero.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const session = await getSession(telegramId);
  if (!session) {
    await sendMessage(
      chatId,
      "⏰ *Sessão expirada*\n\n" +
        "Por favor, envie sua mensagem novamente.\n\n" +
        "💡 Dica: Envie tudo em uma única mensagem para evitar expiração."
    );
    return;
  }

  // Categoria selecionada (comando tradicional)
  if (data.startsWith("cat_")) {
    const categoryId = data.replace("cat_", "");
    session.category_id = categoryId;
    await saveSession(telegramId, session);
    await askForAccount(chatId, telegramId);
    return;
  }

  // Categoria selecionada (linguagem natural)
  if (data.startsWith("nl_cat_")) {
    console.log("🔘 Processando callback nl_cat:", data);
    const payload = data.replace("nl_cat_", "");

    // Formato: sessionId_categoryId
    // sessionId pode ter tamanho variável, então usar o primeiro underscore como separador
    const underscoreIndex = payload.indexOf("_");
    if (underscoreIndex === -1 || underscoreIndex === 0) {
      console.error("❌ Formato de callback inválido:", payload);
      await answerCallbackQuery(query.id, "❌ Erro: formato inválido");
      return;
    }

    const sessionId = payload.substring(0, underscoreIndex);
    const categoryId = payload.substring(underscoreIndex + 1); // Pular o underscore

    console.log(`📊 Session ID: ${sessionId}, Category ID: ${categoryId}`);

    // Buscar sessão temporária
    const { data: sessionData } = await supabase
      .from("telegram_sessions")
      .select("session_data")
      .eq("telegram_id", telegramId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!sessionData?.session_data) {
      console.error("❌ Sessão não encontrada ou expirada:", sessionId);
      await answerCallbackQuery(
        query.id,
        "❌ Sessão expirada. Tente novamente."
      );
      await editMessage(
        chatId,
        messageId,
        "❌ Sessão expirada. Por favor, envie a mensagem novamente."
      );
      return;
    }

    const session = sessionData.session_data as {
      type: "expense" | "income";
      amount: number;
      categoryId: string | null;
      accountId: string | null;
      accountName: string | null;
      description: string;
      currency?: string;
    };

    // Atualizar sessão com a categoria selecionada
    session.categoryId = categoryId;

    console.log("📊 Sessão atualizada:", session);

    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    // Buscar contas
    const accounts = await getUserAccounts(user.user_id);

    // Encontrar conta
    let accountId: string | null = session.accountId;
    if (!accountId && session.accountName) {
      const foundAccount = accounts.find(
        (a: any) =>
          a.name.toLowerCase().includes(session.accountName!.toLowerCase()) ||
          session.accountName!.toLowerCase().includes(a.name.toLowerCase())
      );
      accountId = foundAccount?.id || null;
    }

    // Atualizar sessão no banco com a categoria selecionada
    await supabase
      .from("telegram_sessions")
      .update({ session_data: session })
      .eq("telegram_id", telegramId)
      .eq("session_data->>type", session.type);

    // Se não encontrou conta e tem múltiplas, perguntar
    if (!accountId && accounts.length > 1) {
      // Buscar nome da categoria
      const { data: categoryData } = await supabase
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .single();

      const categoryName = categoryData?.name || "Selecionada";
      const currencySymbol = session.currency === "kr" ? "kr" : "R$";

      // Criar botões de conta usando sessão
      // Formato: nl_acc_sessionId_accountId (sessionId tem 13 chars fixos)
      const accountButtons = accounts.map((acc: any) => {
        const callback = `nl_acc_${sessionId}_${acc.id}`;
        console.log(`📏 Callback conta ${acc.name}: ${callback.length} bytes`);
        return [
          {
            text: `${acc.name}${acc.is_shared ? " (compartilhada)" : ""}`,
            callback_data: callback,
          },
        ];
      });
      accountButtons.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

      await editMessage(
        chatId,
        messageId,
        `❓ Qual conta você quer usar?\n\nValor: ${session.amount
          .toFixed(2)
          .replace(".", ",")} ${currencySymbol}\nCategoria: ${categoryName}`,
        {
          reply_markup: {
            inline_keyboard: accountButtons,
          },
        }
      );
      return;
    }

    // Se só tem uma conta, usar ela
    if (!accountId && accounts.length === 1) {
      accountId = accounts[0].id;
    }

    // Se ainda não tem conta, erro
    if (!accountId) {
      await editMessage(
        chatId,
        messageId,
        "❌ Erro: nenhuma conta disponível."
      );
      return;
    }

    // Atualizar sessão com accountId e criar transação diretamente
    session.accountId = accountId;

    // Atualizar sessão no banco
    await supabase
      .from("telegram_sessions")
      .update({ session_data: session })
      .eq("telegram_id", telegramId)
      .eq("session_data->>type", session.type);

    // Criar transação diretamente
    const result = await confirmNaturalLanguageTransaction(
      telegramId,
      session.type,
      session.amount,
      session.categoryId,
      session.accountId,
      session.description
    );

    if (result?.success) {
      const icon = session.type === "expense" ? "💸" : "💰";
      const typeText = session.type === "expense" ? "Despesa" : "Receita";
      const typeEmoji = session.type === "expense" ? "📉" : "📈";
      const currency = result.accountCurrency || session.currency || "kr";
      const amountFormatted = session.amount.toFixed(2).replace(".", ",");
      const currencySymbol = currency === "kr" ? "kr" : "R$";

      let message =
        `✨ *${typeText} registrada com sucesso!*\n\n` +
        `${typeEmoji} *Valor:* ${icon} ${amountFormatted} ${currencySymbol}\n` +
        `🏷️ *Categoria:* ${result.categoryName}\n` +
        `🏦 *Conta:* ${result.accountName}\n` +
        `📅 *Data:* ${new Date().toLocaleDateString("pt-BR")}`;

      if (
        session.description &&
        session.description !== "Transação via Telegram"
      ) {
        message += `\n📝 *Descrição:* ${session.description}`;
      }

      if (result.usedOutros) {
        message += `\n\n⚠️ *Nota:* Registrado na categoria "Outros" (categoria não identificada)`;
      }

      message += `\n\n✅ Transação salva no sistema!`;

      await editMessage(chatId, messageId, message, { parse_mode: "Markdown" });

      // Limpar sessão
      await supabase
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);
    } else {
      await editMessage(
        chatId,
        messageId,
        `⚠️ *Erro ao registrar transação*\n\n` +
          `Detalhes: ${result?.error?.message || "Erro desconhecido"}\n\n` +
          `💡 Verifique se a conta e categoria estão corretas e tente novamente.`
      );
    }
    return;
  }

  // Conta selecionada após categoria (linguagem natural)
  if (data.startsWith("nl_acc_")) {
    console.log("🔘 Processando callback nl_acc:", data);
    const payload = data.replace("nl_acc_", "");

    // Formato: sessionId_accountId
    // sessionId pode ter tamanho variável, então usar o primeiro underscore como separador
    const underscoreIndex = payload.indexOf("_");
    if (underscoreIndex === -1 || underscoreIndex === 0) {
      console.error("❌ Formato de callback inválido:", payload);
      await answerCallbackQuery(query.id, "❌ Erro: formato inválido");
      return;
    }

    const sessionId = payload.substring(0, underscoreIndex);
    const accountId = payload.substring(underscoreIndex + 1); // Pular o underscore

    console.log(`📊 Session ID: ${sessionId}, Account ID: ${accountId}`);

    // Buscar sessão temporária
    const { data: sessionData } = await supabase
      .from("telegram_sessions")
      .select("session_data")
      .eq("telegram_id", telegramId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!sessionData?.session_data) {
      console.error("❌ Sessão não encontrada ou expirada:", sessionId);
      await answerCallbackQuery(
        query.id,
        "❌ Sessão expirada. Tente novamente."
      );
      await editMessage(
        chatId,
        messageId,
        "❌ Sessão expirada. Por favor, envie a mensagem novamente."
      );
      return;
    }

    const session = sessionData.session_data as {
      type: "expense" | "income";
      amount: number;
      categoryId: string | null;
      accountId: string | null;
      accountName: string | null;
      description: string;
      currency?: string;
    };

    // Atualizar sessão com a conta selecionada
    session.accountId = accountId;

    console.log("📊 Sessão atualizada com conta:", session);

    // Atualizar sessão no banco
    await supabase
      .from("telegram_sessions")
      .update({ session_data: session })
      .eq("telegram_id", telegramId)
      .eq("session_data->>type", session.type);

    // Criar transação diretamente
    const result = await confirmNaturalLanguageTransaction(
      telegramId,
      session.type,
      session.amount,
      session.categoryId,
      session.accountId!,
      session.description
    );

    if (result?.success) {
      const icon = session.type === "expense" ? "💸" : "💰";
      const typeText = session.type === "expense" ? "Despesa" : "Receita";
      const typeEmoji = session.type === "expense" ? "📉" : "📈";
      const currency = result.accountCurrency || session.currency || "kr";
      const amountFormatted = session.amount.toFixed(2).replace(".", ",");
      const currencySymbol = currency === "kr" ? "kr" : "R$";

      let message =
        `✨ *${typeText} registrada com sucesso!*\n\n` +
        `${typeEmoji} *Valor:* ${icon} ${amountFormatted} ${currencySymbol}\n` +
        `🏷️ *Categoria:* ${result.categoryName}\n` +
        `🏦 *Conta:* ${result.accountName}\n` +
        `📅 *Data:* ${new Date().toLocaleDateString("pt-BR")}`;

      if (
        session.description &&
        session.description !== "Transação via Telegram"
      ) {
        message += `\n📝 *Descrição:* ${session.description}`;
      }

      if (result.usedOutros) {
        message += `\n\n⚠️ *Nota:* Registrado na categoria "Outros" (categoria não identificada)`;
      }

      message += `\n\n✅ Transação salva no sistema!`;

      await editMessage(chatId, messageId, message, { parse_mode: "Markdown" });

      // Limpar sessão
      await supabase
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);
    } else {
      await editMessage(
        chatId,
        messageId,
        `⚠️ *Erro ao registrar transação*\n\n` +
          `Detalhes: ${result?.error?.message || "Erro desconhecido"}\n\n` +
          `💡 Verifique se a conta e categoria estão corretas e tente novamente.`
      );
    }
    return;
  }

  // Confirmação de linguagem natural
  if (data.startsWith("nl_confirm_")) {
    console.log("🔘 Processando callback nl_confirm:", data);
    const sessionId = data.replace("nl_confirm_", "");

    // Buscar sessão temporária
    const { data: sessionData } = await supabase
      .from("telegram_sessions")
      .select("session_data")
      .eq("telegram_id", telegramId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!sessionData?.session_data) {
      console.error("❌ Sessão não encontrada ou expirada:", sessionId);
      await answerCallbackQuery(
        query.id,
        "❌ Sessão expirada. Tente novamente."
      );
      await editMessage(
        chatId,
        messageId,
        "❌ Sessão expirada. Por favor, envie a mensagem novamente."
      );
      return;
    }

    const session = sessionData.session_data as {
      type: "expense" | "income";
      amount: number;
      categoryId: string | null;
      accountId: string;
      description: string;
      currency?: string;
    };

    console.log("📊 Dados da sessão:", session);

    // Limpar sessão após usar
    await supabase
      .from("telegram_sessions")
      .delete()
      .eq("telegram_id", telegramId)
      .eq("session_data->>type", session.type);

    const result = await confirmNaturalLanguageTransaction(
      telegramId,
      session.type,
      session.amount,
      session.categoryId,
      session.accountId,
      session.description
    );

    if (result?.success) {
      const icon = session.type === "expense" ? "💸" : "💰";
      const typeText = session.type === "expense" ? "Despesa" : "Receita";
      const typeEmoji = session.type === "expense" ? "📉" : "📈";
      const currency = result.accountCurrency || session.currency || "kr";
      const amountFormatted = session.amount.toFixed(2).replace(".", ",");
      const currencySymbol = currency === "kr" ? "kr" : "R$";

      let message =
        `✨ *${typeText} registrada com sucesso!*\n\n` +
        `${typeEmoji} *Valor:* ${icon} ${amountFormatted} ${currencySymbol}\n` +
        `🏷️ *Categoria:* ${result.categoryName}\n` +
        `🏦 *Conta:* ${result.accountName}\n` +
        `📅 *Data:* ${new Date().toLocaleDateString("pt-BR")}`;

      if (
        session.description &&
        session.description !== "Transação via Telegram"
      ) {
        message += `\n📝 *Descrição:* ${session.description}`;
      }

      if (result.usedOutros) {
        message += `\n\n⚠️ *Nota:* Registrado na categoria "Outros" (categoria não identificada)`;
      }

      message += `\n\n✅ Transação salva no sistema!`;

      await editMessage(chatId, messageId, message, { parse_mode: "Markdown" });
    } else {
      await editMessage(
        chatId,
        messageId,
        `⚠️ *Erro ao registrar transação*\n\n` +
          `Detalhes: ${result?.error?.message || "Erro desconhecido"}\n\n` +
          `💡 Verifique se a conta e categoria estão corretas e tente novamente.`
      );
    }
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
      `✨ *${typeText} registrada com sucesso!*\n\n` +
        `📊 *Valor:* ${icon} ${formatCurrencyForTelegram(
          session.amount || 0,
          account?.currency || "kr"
        )}\n` +
        `🏷️ *Categoria:* ${category?.icon || "🏷️"} ${
          category?.name || "Sem categoria"
        }\n` +
        `🏦 *Conta:* ${account?.name || "Conta"}\n` +
        `${
          session.description ? `📝 *Descrição:* ${session.description}\n` : ""
        }` +
        `📅 *Data:* ${new Date().toLocaleDateString("pt-BR")}\n\n` +
        `✅ Transação salva no sistema!`,
      { parse_mode: "Markdown" }
    );

    await clearSession(telegramId);
  }
}

/**
 * Comando /contas - Listar contas do usuário
 */
/**
 * Busca todas as contas do usuário (próprias + compartilhadas)
 */
async function getUserAccounts(userId: string) {
  // Buscar contas próprias
  const { data: userAccounts } = await supabase
    .from("accounts")
    .select("id, name, icon, currency, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  // Buscar contas compartilhadas
  const { data: sharedMembers } = await supabase
    .from("account_members")
    .select(
      `
      *,
      account:accounts(
        id,
        name,
        icon,
        currency,
        is_active
      )
    `
    )
    .eq("user_id", userId);

  // Combinar contas próprias e compartilhadas
  const userAccountIds = new Set((userAccounts || []).map((acc) => acc.id));
  const sharedAccounts =
    sharedMembers
      ?.map((member: any) => ({
        ...member.account,
        is_shared: true,
        member_role: member.role,
      }))
      .filter(
        (acc: any) =>
          acc && acc.id && acc.is_active && !userAccountIds.has(acc.id)
      ) || [];

  const allAccounts = [...(userAccounts || []), ...sharedAccounts];

  return allAccounts;
}

export async function handleAccountsCommand(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;

  console.log(`📋 Comando /contas recebido de Telegram ID: ${telegramId}`);

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    console.log(`❌ Usuário não encontrado para Telegram ID: ${telegramId}`);
    await sendMessage(
      chatId,
      "🔐 *Autenticação necessária*\n\n" +
        "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
        "👉 Use /start para começar"
    );
    return;
  }

  console.log(`🔍 Buscando contas para user_id: ${user.user_id}`);
  const accounts = await getUserAccounts(user.user_id);

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
  accounts.forEach((account: any, index: number) => {
    const sharedLabel = account.is_shared ? " (compartilhada)" : "";
    messageText += `${index + 1}. ${account.icon || "🏦"} ${
      account.name
    }${sharedLabel}\n`;
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
      "🔐 *Autenticação necessária*\n\n" +
        "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
        "👉 Use /start para começar"
    );
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // Buscar contas do usuário (próprias + compartilhadas)
  const accounts = await getUserAccounts(user.user_id);
  const accountIds = accounts.map((a: any) => a.id);

  if (accountIds.length === 0) {
    await sendMessage(
      chatId,
      "📭 *Nenhuma conta encontrada*\n\n" +
        "Você precisa criar pelo menos uma conta primeiro.\n\n" +
        "💡 Acesse: fincontrol-app.netlify.app/accounts"
    );
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
      "🔐 *Autenticação necessária*\n\n" +
        "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
        "👉 Use /start para começar"
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

  // Buscar contas do usuário (próprias + compartilhadas)
  const accounts = await getUserAccounts(user.user_id);
  const accountIds = accounts.map((a: any) => a.id);

  if (accountIds.length === 0) {
    await sendMessage(
      chatId,
      "📭 *Nenhuma conta encontrada*\n\n" +
        "Você precisa criar pelo menos uma conta primeiro.\n\n" +
        "💡 Acesse: fincontrol-app.netlify.app/accounts"
    );
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
 * Processa mensagem em linguagem natural
 */
export async function handleNaturalLanguage(message: TelegramMessage) {
  const telegramId = message.from.id;
  const chatId = message.chat.id;
  const text = message.text.trim();

  console.log(`💬 Processando linguagem natural: "${text}"`);
  console.log(`📱 Telegram ID: ${telegramId}, Chat ID: ${chatId}`);

  try {
    console.log(`🔍 Buscando usuário para Telegram ID: ${telegramId}`);
    // Buscar usuário
    const user = await getUserByTelegramId(telegramId);
    console.log(
      `👤 Resultado da busca de usuário:`,
      user ? `Encontrado: ${user.user_id}` : "Não encontrado"
    );

    if (!user) {
      console.log(`❌ Usuário não encontrado para Telegram ID: ${telegramId}`);
      await sendMessage(
        chatId,
        "🔐 *Autenticação necessária*\n\n" +
          "Você precisa vincular sua conta do Telegram ao FinControl.\n\n" +
          "👉 Use /start para começar"
      );
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.user_id}`);

    // Buscar contas e categorias do usuário (próprias + compartilhadas)
    console.log(`🔍 Buscando contas para user_id: ${user.user_id}`);
    const accounts = await getUserAccounts(user.user_id);
    console.log(`📊 Contas encontradas: ${accounts?.length || 0}`);

    // Buscar categorias: padrões OU das contas do usuário (próprias + compartilhadas)
    const accountIds = accounts.map((a: any) => a.id);
    let categoriesQuery = supabase.from("categories").select("id, name, type");

    if (accountIds.length > 0) {
      categoriesQuery = categoriesQuery.or(
        `is_default.eq.true,account_id.in.(${accountIds.join(",")})`
      );
    } else {
      categoriesQuery = categoriesQuery.eq("is_default", true);
    }

    const { data: categories } = await categoriesQuery;

    if (!accounts || accounts.length === 0) {
      await sendMessage(
        chatId,
        "❌ Nenhuma conta encontrada.\n\n💡 Crie uma conta primeiro no site: https://fincontrol-app.netlify.app/accounts"
      );
      return;
    }

    // Importar parser
    console.log(`📦 Importando parser de linguagem natural...`);
    const {
      parseNaturalLanguage,
      formatConfirmationMessage,
      generateHelpMessage,
    } = await import("./natural-language-parser");
    console.log(`✅ Parser importado com sucesso`);

    // Parsear mensagem
    console.log(
      `📝 Contas disponíveis: ${accounts.map((a: any) => a.name).join(", ")}`
    );
    console.log(
      `📝 Categorias disponíveis: ${(categories || [])
        .map((c) => c.name)
        .join(", ")}`
    );

    const parsed = parseNaturalLanguage(text, {
      accounts: accounts.map((a: any) => ({ id: a.id, name: a.name })),
      categories: (categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })),
    });

    console.log("📊 Parseado:", JSON.stringify(parsed, null, 2));
    console.log("✅ Passou pelo parsing, continuando...");

    // Se confiança muito baixa ou falta informação crítica
    if (parsed.confidence < 0.5 || !parsed.amount || !parsed.type) {
      console.log("⚠️ Confiança baixa, enviando ajuda");
      const helpMessage = generateHelpMessage({
        accounts: accounts.map((a: any) => ({ id: a.id, name: a.name })),
        categories: (categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })),
      });
      await sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
      return;
    }

    console.log("✅ Confiança OK, buscando categoria...");
    // Encontrar categoria
    let categoryId: string | null = null;
    if (parsed.category) {
      console.log(
        `🔍 Buscando categoria: "${parsed.category}" (tipo: ${parsed.type})`
      );
      const foundCategory = categories?.find(
        (c) =>
          c.name.toLowerCase().includes(parsed.category!.toLowerCase()) &&
          c.type === parsed.type
      );
      categoryId = foundCategory?.id || null;
      console.log(
        `📌 Categoria encontrada: ${
          foundCategory ? foundCategory.name : "NÃO ENCONTRADA"
        } (ID: ${categoryId})`
      );
    } else {
      console.log("⚠️ Nenhuma categoria parseada");
    }

    // Se não encontrou categoria, perguntar ao usuário
    if (!categoryId && parsed.type) {
      const typeCategories =
        categories?.filter((c) => c.type === parsed.type) || [];

      if (typeCategories.length === 0) {
        // Se não há categorias, usar "Outros" se existir
        const outrosCategory = categories?.find(
          (c) =>
            (c.name.toLowerCase().includes("outros") ||
              c.name.toLowerCase().includes("diversos") ||
              c.name.toLowerCase().includes("geral")) &&
            c.type === parsed.type
        );
        categoryId = outrosCategory?.id || null;
      } else {
        // Perguntar qual categoria usar
        // Usar sessão temporária para evitar callback_data muito longo
        // Garantir sempre 13 caracteres
        const sessionId = Math.random()
          .toString(36)
          .substring(2, 15)
          .padEnd(13, "0")
          .substring(0, 13);
        const sessionData = {
          type: parsed.type,
          amount: parsed.amount,
          categoryId: null, // Será preenchido quando o usuário selecionar
          accountId: null, // Será preenchido depois
          accountName: parsed.account || null,
          description: parsed.description || "",
          currency: parsed.currency || "kr",
        };

        // Deletar sessões antigas primeiro
        await supabase
          .from("telegram_sessions")
          .delete()
          .eq("telegram_id", telegramId);

        // Salvar sessão temporária
        const { error: sessionError } = await supabase
          .from("telegram_sessions")
          .insert({
            telegram_id: telegramId,
            session_data: sessionData,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });

        if (sessionError) {
          console.error("❌ Erro ao salvar sessão:", sessionError);
          await sendMessage(
            chatId,
            "⚠️ *Erro ao processar*\n\n" +
              "Não foi possível salvar sua seleção.\n\n" +
              "💡 Tente enviar sua mensagem novamente."
          );
          return;
        }

        const categoryButtons: InlineKeyboardButton[][] = [];

        // Criar botões de categoria (2 por linha) usando apenas categoryId no callback
        // Formato: nl_cat_sessionId_categoryId (sessionId tem 13 chars fixos)
        for (let i = 0; i < typeCategories.length; i += 2) {
          const row: InlineKeyboardButton[] = [];
          // sessionId (13 chars) + _ + categoryId (36 chars UUID) = ~50 chars total
          const callback1 = `nl_cat_${sessionId}_${typeCategories[i].id}`;
          console.log(`📏 Callback categoria ${i}: ${callback1.length} bytes`);
          row.push({
            text: `${typeCategories[i].name}`,
            callback_data: callback1,
          });
          if (i + 1 < typeCategories.length) {
            const callback2 = `nl_cat_${sessionId}_${typeCategories[i + 1].id}`;
            row.push({
              text: `${typeCategories[i + 1].name}`,
              callback_data: callback2,
            });
          }
          categoryButtons.push(row);
        }

        categoryButtons.push([
          { text: "❌ Cancelar", callback_data: "cancel" },
        ]);

        const currencySymbol = parsed.currency === "kr" ? "kr" : "R$";
        const amountFormatted = parsed.amount.toFixed(2).replace(".", ",");
        const accountText = parsed.account
          ? ` na conta "${parsed.account}"`
          : "";

        console.log(`💾 Sessão criada para seleção de categoria: ${sessionId}`);

        await sendMessage(
          chatId,
          `❓ Qual categoria devo registrar?\n\n` +
            `Valor: ${amountFormatted} ${currencySymbol}\n` +
            `Tipo: ${
              parsed.type === "expense" ? "Despesa" : "Receita"
            }${accountText}`,
          {
            reply_markup: {
              inline_keyboard: categoryButtons,
            },
          }
        );
        return;
      }
    }

    // Encontrar conta
    console.log("🔍 Buscando conta...");
    let accountId: string | null = null;
    if (parsed.account) {
      console.log(`🔍 Buscando conta: "${parsed.account}"`);
      const foundAccount = accounts.find(
        (a: any) =>
          a.name.toLowerCase() === parsed.account!.toLowerCase() ||
          a.name.toLowerCase().includes(parsed.account!.toLowerCase()) ||
          parsed.account!.toLowerCase().includes(a.name.toLowerCase())
      );
      accountId = foundAccount?.id || null;
      console.log(
        `📌 Conta encontrada: ${
          foundAccount ? foundAccount.name : "NÃO ENCONTRADA"
        } (ID: ${accountId})`
      );
    } else {
      console.log("⚠️ Nenhuma conta parseada");
    }

    // Se não encontrou conta e tem múltiplas, perguntar
    if (!accountId && accounts.length > 1) {
      await sendMessage(
        chatId,
        `❓ Qual conta você quer usar?\n\nValor: ${parsed.amount
          .toFixed(2)
          .replace(".", ",")} ${
          parsed.currency === "kr" ? "kr" : "R$"
        }\nCategoria: ${parsed.category || "Outros"}`,
        {
          reply_markup: {
            inline_keyboard: [
              ...accounts.map((acc: any) => [
                {
                  text: `${acc.name}${acc.is_shared ? " (compartilhada)" : ""}`,
                  callback_data: `nl_confirm_${parsed.type}_${parsed.amount}_${
                    categoryId || "null"
                  }_${acc.id}_${encodeURIComponent(parsed.description)}`,
                },
              ]),
              [{ text: "❌ Cancelar", callback_data: "cancel" }],
            ],
          },
        }
      );
      return;
    }

    // Se só tem uma conta, usar ela
    if (!accountId && accounts.length === 1) {
      console.log("✅ Usando única conta disponível");
      accountId = accounts[0].id;
    }

    // Se ainda não tem conta, erro
    if (!accountId) {
      console.log("❌ Erro: nenhuma conta disponível");
      await sendMessage(chatId, "❌ Erro: nenhuma conta disponível.");
      return;
    }

    console.log(`✅ Conta final: ${accountId}`);

    // Se categoria não foi encontrada, buscar "Outros"
    if (!categoryId) {
      console.log("🔍 Categoria não encontrada, buscando 'Outros'...");
      const outrosCategory = categories?.find(
        (c) =>
          (c.name.toLowerCase().includes("outros") ||
            c.name.toLowerCase().includes("diversos") ||
            c.name.toLowerCase().includes("geral")) &&
          c.type === parsed.type
      );
      categoryId = outrosCategory?.id || null;
      console.log(
        `📌 Categoria 'Outros' encontrada: ${
          outrosCategory ? outrosCategory.name : "NÃO ENCONTRADA"
        } (ID: ${categoryId})`
      );
    }

    console.log(`✅ Categoria final: ${categoryId}`);

    // Buscar dados da conta para pegar moeda
    const { data: accountData } = await supabase
      .from("accounts")
      .select("name, currency")
      .eq("id", accountId)
      .single();

    // Formatar confirmação
    const accountDataFromList = accounts.find((a: any) => a.id === accountId);
    const accountName =
      accountData?.name || accountDataFromList?.name || "Conta";
    const isShared = accountDataFromList?.is_shared || false;
    const categoryName =
      categories?.find((c) => c.id === categoryId)?.name || "Outros";
    const currency = accountData?.currency || parsed.currency || "kr";
    const currencySymbol = currency === "kr" ? "kr" : "R$";
    const amountFormatted = parsed.amount.toFixed(2).replace(".", ",");

    const sharedLabel = isShared ? " (compartilhada)" : "";
    const confirmationMessage = `✅ Ok, devo registrar ${
      parsed.type === "expense" ? "despesa" : "receita"
    } de ${amountFormatted} ${currencySymbol} na categoria "${categoryName}" na conta "${accountName}${sharedLabel}"?`;

    console.log("📤 Preparando para enviar mensagem de confirmação...");
    console.log(`📝 Mensagem: ${confirmationMessage}`);
    console.log(
      `📝 Chat ID: ${chatId}, Account ID: ${accountId}, Category ID: ${categoryId}`
    );

    try {
      // Usar sessão temporária para evitar callback_data muito longo
      // UUIDs são muito longos (36 caracteres cada), então usamos sessão
      // Garantir sempre 13 caracteres
      const sessionId = Math.random()
        .toString(36)
        .substring(2, 15)
        .padEnd(13, "0")
        .substring(0, 13);
      const sessionData = {
        type: parsed.type,
        amount: parsed.amount,
        categoryId: categoryId,
        accountId: accountId,
        description: parsed.description || "",
        currency: parsed.currency || "kr",
      };

      // Deletar sessões antigas primeiro
      await supabase
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);

      // Salvar sessão temporária (expira em 10 minutos)
      const { error: sessionError } = await supabase
        .from("telegram_sessions")
        .insert({
          telegram_id: telegramId,
          session_data: sessionData,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (sessionError) {
        console.error("❌ Erro ao salvar sessão:", sessionError);
        throw new Error("Erro ao salvar sessão");
      }

      // Usar apenas sessionId no callback_data (muito mais curto)
      const callbackData = `nl_confirm_${sessionId}`;
      const callbackDataBytes = new TextEncoder().encode(callbackData).length;
      console.log(`📏 Tamanho do callback_data: ${callbackDataBytes} bytes`);
      console.log(`💾 Sessão salva com ID: ${sessionId}`);

      const result = await sendMessage(chatId, confirmationMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Sim",
                callback_data: callbackData,
              },
              { text: "❌ Não", callback_data: "cancel" },
            ],
          ],
        },
      });

      console.log(
        "✅ Mensagem enviada, resultado:",
        result?.ok ? "OK" : "ERRO"
      );

      if (!result?.ok) {
        console.error(
          "❌ Erro ao enviar mensagem de confirmação:",
          JSON.stringify(result, null, 2)
        );
        console.error(
          "❌ Detalhes do erro:",
          result.description || result.error_code
        );
        // Não enviar mensagem de erro aqui, deixar o catch externo tratar
        throw new Error(
          `Telegram API error: ${result.description || "Unknown error"}`
        );
      }

      console.log("✅ Mensagem de confirmação enviada com sucesso!");
    } catch (sendError) {
      console.error("❌ Exceção ao enviar mensagem:", sendError);
      if (sendError instanceof Error) {
        console.error("Mensagem:", sendError.message);
        console.error("Stack:", sendError.stack);
      }
      try {
        await sendMessage(
          chatId,
          "❌ Erro ao processar sua mensagem. Tente novamente."
        );
      } catch (finalError) {
        console.error("❌ Erro crítico:", finalError);
      }
    }

    console.log("✅ handleNaturalLanguage finalizado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao processar linguagem natural:");
    console.error("Tipo do erro:", typeof error);
    console.error("Erro completo:", error);
    if (error instanceof Error) {
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
      console.error("Name:", error.name);
    } else {
      console.error(
        "Erro não é uma instância de Error:",
        JSON.stringify(error)
      );
    }

    try {
      await sendMessage(
        chatId,
        "⚠️ *Erro ao processar mensagem*\n\n" +
          "Não consegui entender sua mensagem.\n\n" +
          "💡 *Dicas:*\n" +
          '• Use formatos como: "gasto 50 mercado conta pessoal"\n' +
          "• Ou use os comandos: /gasto, /receita\n" +
          "• Use /help para ver exemplos"
      );
    } catch (sendError) {
      console.error("❌ Erro ao enviar mensagem de erro:", sendError);
    }
  }
}

/**
 * Confirma e cria transação a partir de linguagem natural
 */
export async function confirmNaturalLanguageTransaction(
  telegramId: number,
  type: "expense" | "income",
  amount: number,
  categoryId: string | null,
  accountId: string,
  description: string
) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  // Se categoria é null, buscar "Outros"
  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    const { data: outrosCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("type", type)
      .or("name.ilike.%outros%,name.ilike.%diversos%,name.ilike.%geral%")
      .limit(1)
      .single();

    finalCategoryId = outrosCategory?.id || null;
  }

  // Criar transação
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.user_id,
      account_id: accountId,
      type,
      amount,
      category_id: finalCategoryId,
      description: description || "Transação via Telegram",
      transaction_date: new Date().toISOString().split("T")[0], // Data atual
      created_via: "api",
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Erro ao criar transação:", error);
    return { success: false, error };
  }

  // Buscar dados completos para confirmação
  const { data: category } = await supabase
    .from("categories")
    .select("name, icon")
    .eq("id", finalCategoryId)
    .single();

  const { data: account } = await supabase
    .from("accounts")
    .select("name, currency")
    .eq("id", accountId)
    .single();

  const categoryName = category?.name || "Outros";
  const usedOutros =
    !categoryId && categoryName.toLowerCase().includes("outros");

  return {
    success: true,
    transaction,
    categoryName,
    accountName: account?.name || "Conta",
    accountCurrency: account?.currency || "kr",
    usedOutros,
  };
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
