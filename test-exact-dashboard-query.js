// Script para testar a query exata do dashboard
// Execute com: node test-exact-dashboard-query.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExactDashboardQuery() {
  console.log("🎯 TESTANDO QUERY EXATA DO DASHBOARD...");

  try {
    // 1. Buscar usuário nardogomes@live.com
    console.log("👤 Buscando usuário...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", "nardogomes@live.com")
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error("❌ Usuário não encontrado:", usersError?.message);
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário: ${user.email} (${user.full_name})`);

    // 2. Buscar contas do usuário (como no dashboard)
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

    // 3. Query EXATA do dashboard (com filtro de data)
    console.log("\n💰 EXECUTANDO QUERY EXATA DO DASHBOARD...");
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(
      `📅 Filtro de data: ${firstDayOfMonth.toISOString()} até ${lastDayOfMonth.toISOString()}`
    );

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
      .gte("transaction_date", firstDayOfMonth.toISOString())
      .lte("transaction_date", lastDayOfMonth.toISOString())
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error(
        "❌ Erro na query do dashboard:",
        transactionsError.message
      );
      return;
    }

    console.log(`✅ Transações encontradas: ${transactions?.length || 0}`);

    if (transactions && transactions.length > 0) {
      console.log("\n📋 TRANSAÇÕES DO DASHBOARD:");
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

      // 4. Calcular totais EXATOS do dashboard
      console.log("\n🧮 CALCULANDO TOTAIS EXATOS DO DASHBOARD:");

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

      console.log("\n💰 TOTAIS QUE DEVEM APARECER NO DASHBOARD:");
      console.log(`  Receitas: ${totalIncome} kr`);
      console.log(`  Despesas: ${totalExpense} kr`);
      console.log(`  Balanço: ${totalIncome - totalExpense} kr`);

      // 5. Testar filtro por conta ativa (primeira conta)
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

        console.log(`💰 Totais filtrados por conta ativa:`);
        console.log(`  Receitas: ${filteredIncome} kr`);
        console.log(`  Despesas: ${filteredExpense} kr`);
        console.log(`  Balanço: ${filteredIncome - filteredExpense} kr`);
      }

      console.log(
        "\n🎉 SE OS TOTAIS ACIMA SÃO DIFERENTES DE 0, O PROBLEMA ESTÁ NO CÓDIGO DO DASHBOARD!"
      );
      console.log(
        "📝 Verifique o componente Dashboard.tsx e a página dashboard/page.tsx"
      );
    } else {
      console.log("⚠️ Nenhuma transação encontrada para o mês atual!");
      console.log("📝 Isso explica por que o dashboard mostra 0 kr");
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
testExactDashboardQuery();
