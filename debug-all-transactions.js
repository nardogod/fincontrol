// Script completo para debug de todas as transações
// Execute no console do navegador

console.log("🔍 DEBUG COMPLETO DE TRANSAÇÕES...");

// 1. Verificar usuário
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();
console.log("👤 Usuário:", user?.email, "ID:", user?.id);

if (!user) {
  console.log("❌ Usuário não autenticado!");
  return;
}

// 2. Verificar contas do usuário
const { data: userAccounts, error: accountsError } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.id);

console.log("🏦 Contas do usuário:", userAccounts?.length || 0);
console.log("📋 Detalhes das contas:", userAccounts);

// 3. Verificar TODAS as transações (sem filtro)
console.log("\n📊 TODAS AS TRANSAÇÕES (sem filtro):");
const { data: allTransactions, error: allError } = await supabase
  .from("transactions")
  .select(
    `
    id, type, amount, description, transaction_date, created_via,
    category:categories(name, icon),
    account:accounts(name, icon, user_id),
    user:users(full_name, email)
  `
  )
  .order("transaction_date", { ascending: false });

console.log("Total de transações:", allTransactions?.length || 0);
console.log("Transações:", allTransactions);

// 4. Verificar transações filtradas por contas do usuário
if (userAccounts && userAccounts.length > 0) {
  console.log("\n🔍 TRANSAÇÕES FILTRADAS POR CONTAS DO USUÁRIO:");
  const accountIds = userAccounts.map((acc) => acc.id);

  const { data: filteredTransactions, error: filteredError } = await supabase
    .from("transactions")
    .select(
      `
      id, type, amount, description, transaction_date, created_via,
      category:categories(name, icon),
      account:accounts(name, icon, user_id),
      user:users(full_name, email)
    `
    )
    .in("account_id", accountIds)
    .order("transaction_date", { ascending: false });

  console.log("Transações filtradas:", filteredTransactions?.length || 0);
  console.log("Detalhes:", filteredTransactions);
}

// 5. Verificar transações por conta individual
if (userAccounts && userAccounts.length > 0) {
  console.log("\n📋 TRANSAÇÕES POR CONTA:");
  for (const account of userAccounts) {
    const { data: accountTransactions, error: accountError } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date, created_via,
        category:categories(name, icon),
        account:accounts(name, icon, user_id),
        user:users(full_name, email)
      `
      )
      .eq("account_id", account.id)
      .order("transaction_date", { ascending: false });

    console.log(
      `Conta "${account.name}":`,
      accountTransactions?.length || 0,
      "transações"
    );
    if (accountTransactions && accountTransactions.length > 0) {
      console.log("Transações:", accountTransactions);
    }
  }
}

console.log("\n✅ DEBUG COMPLETO FINALIZADO!");
