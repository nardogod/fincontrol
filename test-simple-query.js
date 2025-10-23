// Script para testar query simples
// Execute com: node test-simple-query.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleQuery() {
  console.log("🔍 TESTANDO QUERY SIMPLES...");

  try {
    // 1. Buscar usuário
    console.log("👤 Buscando usuário...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error("❌ Nenhum usuário encontrado:", usersError?.message);
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário: ${user.email} (${user.full_name})`);

    // 2. Buscar contas do usuário
    console.log("\n🏦 Buscando contas...");
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

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

    // 3. Buscar transações SEM JOIN com users (corrigido)
    console.log("\n💰 Buscando transações (query corrigida)...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        *, 
        category:categories(*), 
        account:accounts(*)
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

      // 4. Calcular totais
      console.log("\n🧮 CALCULANDO TOTAIS:");

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

      // 5. Testar filtro por conta ativa
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
testSimpleQuery();
