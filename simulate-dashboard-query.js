// Script para simular a query do dashboard
// Execute com: node simulate-dashboard-query.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateDashboardQuery() {
  console.log("🎯 SIMULANDO QUERY DO DASHBOARD...");

  try {
    // Simular como se fosse um usuário específico (pegamos o primeiro usuário)
    console.log("👤 Buscando primeiro usuário...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error("❌ Nenhum usuário encontrado:", usersError?.message);
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário simulado: ${user.email} (${user.full_name})`);
    console.log(`🆔 User ID: ${user.id}`);

    // 1. Buscar contas do usuário (como no dashboard)
    console.log("\n🏦 Buscando contas do usuário...");
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (accountsError) {
      console.error("❌ Erro ao buscar contas:", accountsError.message);
      return;
    }

    console.log(`✅ Contas encontradas: ${accounts?.length || 0}`);
    accounts?.forEach((account, index) => {
      console.log(
        `  ${index + 1}. ${account.name} (${account.type}) - ID: ${account.id}`
      );
    });

    if (!accounts || accounts.length === 0) {
      console.log("⚠️ Usuário não tem contas!");
      return;
    }

    // 2. Buscar transações (como no dashboard - SEM filtro de data)
    console.log("\n💰 Buscando transações (sem filtro de data)...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        *, 
        category:categories(*), 
        account:accounts(*),
        user:users(full_name, email)
      `
      )
      .in(
        "account_id",
        accounts.map((a) => a.id)
      )
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("❌ Erro ao buscar transações:", transactionsError.message);
      return;
    }

    console.log(`✅ Transações encontradas: ${transactions?.length || 0}`);

    if (transactions && transactions.length > 0) {
      console.log("\n📋 DETALHES DAS TRANSAÇÕES:");
      transactions.forEach((t, index) => {
        console.log(
          `  ${index + 1}. ${t.type === "income" ? "💰" : "💸"} ${t.amount} kr`
        );
        console.log(`     Categoria: ${t.category?.name || "Sem categoria"}`);
        console.log(`     Conta: ${t.account?.name || "Sem conta"}`);
        console.log(`     Data: ${t.transaction_date}`);
        console.log(`     Descrição: ${t.description || "Sem descrição"}`);
        console.log("     ---");
      });

      // 3. Calcular totais (como no dashboard)
      console.log("\n🧮 CALCULANDO TOTAIS (como no dashboard):");

      const incomeTransactions = transactions.filter(
        (t) => t.type === "income"
      );
      const expenseTransactions = transactions.filter(
        (t) => t.type === "expense"
      );

      console.log(`📈 Transações de receita: ${incomeTransactions.length}`);
      incomeTransactions.forEach((t) => {
        console.log(
          `  + ${t.amount} kr - ${t.category?.name} - ${t.description}`
        );
      });

      console.log(`📉 Transações de despesa: ${expenseTransactions.length}`);
      expenseTransactions.forEach((t) => {
        console.log(
          `  - ${t.amount} kr - ${t.category?.name} - ${t.description}`
        );
      });

      const totalIncome = incomeTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const totalExpense = expenseTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      console.log("\n💰 TOTAIS CALCULADOS:");
      console.log(`  Receitas: ${totalIncome} kr`);
      console.log(`  Despesas: ${totalExpense} kr`);
      console.log(`  Balanço: ${totalIncome - totalExpense} kr`);

      // 4. Verificar filtro por conta ativa (como no dashboard)
      if (accounts.length > 0) {
        const activeAccountId = accounts[0].id;
        console.log(
          `\n🎯 FILTRANDO POR CONTA ATIVA: ${accounts[0].name} (${activeAccountId})`
        );

        const filteredTransactions = transactions.filter(
          (t) => t.account_id === activeAccountId
        );
        console.log(`✅ Transações filtradas: ${filteredTransactions.length}`);

        const filteredIncome = filteredTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const filteredExpense = filteredTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log(`💰 Totais filtrados:`);
        console.log(`  Receitas: ${filteredIncome} kr`);
        console.log(`  Despesas: ${filteredExpense} kr`);
        console.log(`  Balanço: ${filteredIncome - filteredExpense} kr`);
      }
    } else {
      console.log("⚠️ Nenhuma transação encontrada para este usuário!");
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
simulateDashboardQuery();
