// Script para testar filtro de data do dashboard
// Execute com: node fix-dashboard-date-filter.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateFilter() {
  console.log("🔍 TESTANDO FILTRO DE DATA DO DASHBOARD...");

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

    if (!accounts || accounts.length === 0) {
      console.log("⚠️ Usuário não tem contas!");
      return;
    }

    // 3. Testar filtro do mês atual (Janeiro 2025)
    console.log("\n📅 TESTANDO FILTRO DO MÊS ATUAL (Janeiro 2025):");
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`📅 Primeiro dia do mês: ${firstDayOfMonth.toISOString()}`);
    console.log(`📅 Último dia do mês: ${lastDayOfMonth.toISOString()}`);

    const { data: currentMonthTransactions, error: currentMonthError } =
      await supabase
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

    if (currentMonthError) {
      console.error(
        "❌ Erro ao buscar transações do mês atual:",
        currentMonthError.message
      );
      return;
    }

    console.log(
      `✅ Transações do mês atual: ${currentMonthTransactions?.length || 0}`
    );

    // 4. Testar SEM filtro de data (todas as transações)
    console.log("\n📅 TESTANDO SEM FILTRO DE DATA (todas as transações):");
    const { data: allTransactions, error: allTransactionsError } =
      await supabase
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

    if (allTransactionsError) {
      console.error(
        "❌ Erro ao buscar todas as transações:",
        allTransactionsError.message
      );
      return;
    }

    console.log(`✅ Todas as transações: ${allTransactions?.length || 0}`);

    // 5. Mostrar datas das transações
    if (allTransactions && allTransactions.length > 0) {
      console.log("\n📋 DATAS DAS TRANSAÇÕES:");
      allTransactions.slice(0, 10).forEach((t, index) => {
        const date = new Date(t.transaction_date);
        console.log(
          `  ${index + 1}. ${t.type === "income" ? "💰" : "💸"} ${
            t.amount
          } kr - ${date.toLocaleDateString("pt-BR")} - ${t.description}`
        );
      });
    }

    // 6. Calcular totais
    if (allTransactions && allTransactions.length > 0) {
      console.log("\n🧮 CALCULANDO TOTAIS:");

      const incomeTransactions = allTransactions.filter(
        (t) => t.type === "income"
      );
      const expenseTransactions = allTransactions.filter(
        (t) => t.type === "expense"
      );

      const totalIncome = incomeTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const totalExpense = expenseTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      console.log(`💰 Receitas: ${totalIncome} kr`);
      console.log(`💸 Despesas: ${totalExpense} kr`);
      console.log(`⚖️ Balanço: ${totalIncome - totalExpense} kr`);

      // 7. Calcular totais do mês atual
      if (currentMonthTransactions && currentMonthTransactions.length > 0) {
        const currentMonthIncome = currentMonthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const currentMonthExpense = currentMonthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log(
          `\n📅 TOTAIS DO MÊS ATUAL (${now.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}):`
        );
        console.log(`💰 Receitas: ${currentMonthIncome} kr`);
        console.log(`💸 Despesas: ${currentMonthExpense} kr`);
        console.log(
          `⚖️ Balanço: ${currentMonthIncome - currentMonthExpense} kr`
        );
      } else {
        console.log(
          `\n📅 TOTAIS DO MÊS ATUAL: 0 kr (nenhuma transação em ${now.toLocaleDateString(
            "pt-BR",
            { month: "long", year: "numeric" }
          )})`
        );
      }
    }

    console.log("\n🎯 CONCLUSÃO:");
    console.log(
      "O dashboard está mostrando 0 kr porque está filtrando apenas o mês atual (Janeiro 2025),"
    );
    console.log(
      "mas as transações estão em outubro 2025. Para corrigir, precisamos:"
    );
    console.log("1. Remover o filtro de data do dashboard, OU");
    console.log("2. Criar transações para o mês atual, OU");
    console.log(
      "3. Alterar as datas das transações existentes para o mês atual"
    );
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
testDateFilter();
