// Script completo de debug do dashboard
// Execute no console do navegador

console.log("🔍 INICIANDO DEBUG COMPLETO DO DASHBOARD");

// 1. Verificar usuário atual
const checkUser = async () => {
  const { createClient } = await import(
    "https://cdn.skypack.dev/@supabase/supabase-js@2"
  );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("👤 Usuário atual:", { user: user?.email, error });
  return { user, supabase };
};

// 2. Verificar contas
const checkAccounts = async (supabase, userId) => {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId);

  console.log("🏦 Contas do usuário:", { accounts, error });
  return accounts;
};

// 3. Verificar TODAS as transações
const checkAllTransactions = async (supabase) => {
  const { data: allTransactions, error } = await supabase
    .from("transactions")
    .select(
      `
      id, type, amount, description, transaction_date, created_via,
      category:categories(name, icon),
      account:accounts(name, icon, user_id)
    `
    )
    .order("transaction_date", { ascending: false });

  console.log("📊 TODAS as transações:", {
    count: allTransactions?.length,
    transactions: allTransactions,
    error,
  });
  return allTransactions;
};

// 4. Verificar transações do usuário
const checkUserTransactions = async (supabase, accountIds) => {
  const { data: userTransactions, error } = await supabase
    .from("transactions")
    .select(
      `
      id, type, amount, description, transaction_date, created_via,
      category:categories(name, icon),
      account:accounts(name, icon, user_id)
    `
    )
    .in("account_id", accountIds)
    .order("transaction_date", { ascending: false });

  console.log("👤 Transações do usuário:", {
    count: userTransactions?.length,
    transactions: userTransactions,
    error,
  });
  return userTransactions;
};

// 5. Testar inserção de transação
const testInsertTransaction = async (supabase, accountId, categoryId) => {
  const testTransaction = {
    type: "expense",
    amount: 100,
    category_id: categoryId,
    account_id: accountId,
    description: "Teste de debug",
    transaction_date: new Date().toISOString().split("T")[0],
    created_via: "web",
  };

  console.log("🧪 Testando inserção:", testTransaction);

  const { data, error } = await supabase
    .from("transactions")
    .insert(testTransaction)
    .select();

  console.log("✅ Resultado da inserção:", { data, error });
  return { data, error };
};

// Executar debug completo
const runCompleteDebug = async () => {
  try {
    const { user, supabase } = await checkUser();
    if (!user) {
      console.error("❌ Usuário não encontrado");
      return;
    }

    const accounts = await checkAccounts(supabase, user.id);
    if (!accounts || accounts.length === 0) {
      console.error("❌ Nenhuma conta encontrada");
      return;
    }

    const allTransactions = await checkAllTransactions(supabase);
    const userTransactions = await checkUserTransactions(
      supabase,
      accounts.map((a) => a.id)
    );

    // Buscar primeira categoria disponível
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .limit(1);

    if (categories && categories.length > 0) {
      await testInsertTransaction(supabase, accounts[0].id, categories[0].id);
    }

    console.log("🎯 DEBUG COMPLETO FINALIZADO");
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
};

// Executar
runCompleteDebug();
