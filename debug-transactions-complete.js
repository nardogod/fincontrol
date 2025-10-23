// Script completo para debug de transações
// Execute no console do navegador

console.log("🔍 INICIANDO DEBUG COMPLETO DE TRANSAÇÕES...");

// 1. Verificar usuário atual
console.log("\n1️⃣ VERIFICANDO USUÁRIO ATUAL:");
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();
console.log("Usuário:", user?.email, "ID:", user?.id);
console.log("Erro:", userError);

if (!user) {
  console.log("❌ Usuário não autenticado!");
  return;
}

// 2. Verificar todas as contas
console.log("\n2️⃣ VERIFICANDO TODAS AS CONTAS:");
const { data: allAccounts, error: allAccountsError } = await supabase
  .from("accounts")
  .select("*");
console.log("Todas as contas:", allAccounts);
console.log("Erro:", allAccountsError);

// 3. Verificar contas do usuário
console.log("\n3️⃣ VERIFICANDO CONTAS DO USUÁRIO:");
const { data: userAccounts, error: userAccountsError } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.id);
console.log("Contas do usuário:", userAccounts);
console.log("Erro:", userAccountsError);

// 4. Verificar todas as transações
console.log("\n4️⃣ VERIFICANDO TODAS AS TRANSAÇÕES:");
const { data: allTransactions, error: allTransactionsError } = await supabase
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
console.log("Todas as transações:", allTransactions);
console.log("Erro:", allTransactionsError);

// 5. Verificar transações do usuário (por contas)
if (userAccounts && userAccounts.length > 0) {
  console.log("\n5️⃣ VERIFICANDO TRANSAÇÕES DAS CONTAS DO USUÁRIO:");
  const accountIds = userAccounts.map((acc) => acc.id);
  console.log("Account IDs:", accountIds);

  const { data: userTransactions, error: userTransactionsError } =
    await supabase
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
  console.log("Transações das contas do usuário:", userTransactions);
  console.log("Erro:", userTransactionsError);
}

// 6. Verificar transações por data (mês atual)
console.log("\n6️⃣ VERIFICANDO TRANSAÇÕES DO MÊS ATUAL:");
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

console.log("Primeiro dia do mês:", firstDayOfMonth.toISOString());
console.log("Último dia do mês:", lastDayOfMonth.toISOString());

const { data: currentMonthTransactions, error: currentMonthError } =
  await supabase
    .from("transactions")
    .select(
      `
    id, type, amount, description, transaction_date, created_via,
    category:categories(name, icon),
    account:accounts(name, icon, user_id),
    user:users(full_name, email)
  `
    )
    .gte("transaction_date", firstDayOfMonth.toISOString())
    .lte("transaction_date", lastDayOfMonth.toISOString())
    .order("transaction_date", { ascending: false });
console.log("Transações do mês atual:", currentMonthTransactions);
console.log("Erro:", currentMonthError);

// 7. Verificar RLS policies
console.log("\n7️⃣ VERIFICANDO RLS POLICIES:");
const { data: policies, error: policiesError } = await supabase
  .from("supabase_policies")
  .select("*")
  .in("table_name", ["transactions", "accounts"]);
console.log("RLS Policies:", policies);
console.log("Erro:", policiesError);

console.log("\n✅ DEBUG COMPLETO FINALIZADO!");
