// Script simples de debug - Execute no console do navegador
// Este script usa o Supabase client já disponível na página

console.log("🔍 DEBUG SIMPLES - INICIANDO");

// Função para acessar o Supabase client da página
const getSupabaseClient = () => {
  // Tentar diferentes formas de acessar o Supabase
  if (window.supabase) {
    return window.supabase;
  }

  // Procurar por elementos que possam ter o client
  const scripts = document.querySelectorAll("script");
  for (let script of scripts) {
    if (script.src && script.src.includes("supabase")) {
      console.log("📦 Script Supabase encontrado:", script.src);
    }
  }

  // Tentar importar dinamicamente
  return import("https://cdn.skypack.dev/@supabase/supabase-js@2").then(
    (module) => {
      const { createClient } = module;

      // Usar as variáveis de ambiente do Next.js
      const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzQsImV4cCI6MjA1MDU1MDg3NH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq";

      return createClient(supabaseUrl, supabaseKey);
    }
  );
};

// Função principal de debug
const runSimpleDebug = async () => {
  try {
    console.log("🔧 Obtendo cliente Supabase...");
    const supabase = await getSupabaseClient();

    // 1. Verificar usuário atual
    console.log("👤 Verificando usuário...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Erro ao buscar usuário:", userError);
      return;
    }

    if (!user) {
      console.error("❌ Usuário não encontrado");
      return;
    }

    console.log("✅ Usuário encontrado:", {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
    });

    // 2. Buscar contas do usuário
    console.log("🏦 Buscando contas...");
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

    if (accountsError) {
      console.error("❌ Erro ao buscar contas:", accountsError);
      return;
    }

    console.log("✅ Contas encontradas:", {
      count: accounts?.length || 0,
      accounts: accounts?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
      })),
    });

    if (!accounts || accounts.length === 0) {
      console.error("❌ Nenhuma conta encontrada");
      return;
    }

    // 3. Buscar transações
    console.log("📊 Buscando transações...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date, created_via,
        category:categories(name, icon),
        account:accounts(name, icon)
      `
      )
      .in(
        "account_id",
        accounts.map((a) => a.id)
      )
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("❌ Erro ao buscar transações:", transactionsError);
      return;
    }

    console.log("✅ Transações encontradas:", {
      count: transactions?.length || 0,
      transactions: transactions?.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        account: t.account?.name,
        category: t.category?.name,
        date: t.transaction_date,
      })),
    });

    // 4. Calcular totais
    if (transactions && transactions.length > 0) {
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      console.log("💰 Totais calculados:", {
        income: income,
        expense: expense,
        balance: income - expense,
      });
    }

    console.log("🎯 DEBUG SIMPLES FINALIZADO COM SUCESSO!");
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
};

// Executar debug
runSimpleDebug();
