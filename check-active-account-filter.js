// Script para verificar qual conta está sendo selecionada por padrão
// e se ela tem transações no mês atual

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActiveAccountFilter() {
  console.log("🔍 VERIFICANDO FILTRO DE CONTA ATIVA\n");
  console.log("=".repeat(80));

  try {
    // 1. Buscar usuário
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("email", "nardogomes@live.com")
      .limit(1);

    if (!users || users.length === 0) {
      console.error("❌ Usuário não encontrado");
      return;
    }

    const user = users[0];

    // 2. Buscar contas (como no dashboard)
    const { data: userAccounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Ordenar contas: principal primeiro, depois por data de criação
    const sortedUserAccounts = (userAccounts || []).sort((a, b) => {
      if (a.type === "principal" && b.type !== "principal") return -1;
      if (b.type === "principal" && a.type !== "principal") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    console.log("📋 CONTAS ORDENADAS (como no dashboard):");
    sortedUserAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.type}) - ID: ${account.id}`);
      console.log(`      Criada em: ${account.created_at}`);
    });

    // 3. A primeira conta será a conta ativa por padrão
    const activeAccount = sortedUserAccounts[0];
    if (!activeAccount) {
      console.log("❌ Nenhuma conta encontrada");
      return;
    }

    console.log(`\n🎯 CONTA ATIVA POR PADRÃO: ${activeAccount.name} (${activeAccount.id})`);

    // 4. Verificar transações desta conta no mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`\n📅 PERÍODO ATUAL (Filtro padrão: "current-month"):`);
    console.log(`   De: ${firstDayOfMonth.toISOString()}`);
    console.log(`   Até: ${lastDayOfMonth.toISOString()}`);

    const { data: allTransactions } = await supabase
      .from("transactions")
      .select("id, type, amount, transaction_date")
      .eq("account_id", activeAccount.id)
      .order("transaction_date", { ascending: false });

    console.log(`\n📊 TODAS AS TRANSAÇÕES DA CONTA "${activeAccount.name}":`);
    console.log(`   Total: ${allTransactions?.length || 0} transações`);

    if (allTransactions && allTransactions.length > 0) {
      allTransactions.forEach((t, index) => {
        const date = new Date(t.transaction_date);
        const isCurrentMonth = date >= firstDayOfMonth && date <= lastDayOfMonth;
        console.log(`   ${index + 1}. ${t.type} - ${t.amount} - ${t.transaction_date} ${isCurrentMonth ? "✅ (Este mês)" : "❌ (Fora do mês)"}`);
      });

      // Filtrar transações do mês atual
      const currentMonthTransactions = (allTransactions || []).filter((t) => {
        const date = new Date(t.transaction_date);
        return date >= firstDayOfMonth && date <= lastDayOfMonth;
      });

      console.log(`\n💰 TRANSAÇÕES DO MÊS ATUAL (após filtro):`);
      console.log(`   Total: ${currentMonthTransactions.length} transações`);

      if (currentMonthTransactions.length === 0) {
        console.log("\n❌ PROBLEMA IDENTIFICADO:");
        console.log(`   A conta ativa "${activeAccount.name}" não tem transações no mês atual!`);
        console.log(`   O dashboard está filtrando por esta conta E pelo período "current-month"`);
        console.log(`   Resultado: Nenhuma transação encontrada = valores zerados`);
      } else {
        const income = currentMonthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = currentMonthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log(`   Receitas: ${income.toFixed(2)}`);
        console.log(`   Despesas: ${expense.toFixed(2)}`);
        console.log(`   Balanço: ${(income - expense).toFixed(2)}`);
      }
    } else {
      console.log(`\n❌ PROBLEMA IDENTIFICADO:`);
      console.log(`   A conta ativa "${activeAccount.name}" não tem nenhuma transação!`);
    }

    // 5. Verificar todas as contas para ver qual tem mais transações no mês atual
    console.log(`\n📊 VERIFICANDO TODAS AS CONTAS:`);
    const { data: sharedAccounts } = await supabase
      .from("account_members")
      .select(
        `
        *,
        account:accounts(*)
      `
      )
      .eq("user_id", user.id);

    const userAccountIds = new Set((userAccounts || []).map((acc) => acc.id));
    const sharedAccountData = (sharedAccounts || [])
      .map((member) => member.account)
      .filter((acc) => acc && !userAccountIds.has(acc.id));

    const allUserAccounts = [...(userAccounts || []), ...sharedAccountData];

    for (const account of allUserAccounts) {
      const { data: accountTransactions } = await supabase
        .from("transactions")
        .select("id, type, amount, transaction_date")
        .eq("account_id", account.id);

      const currentMonthTransactions = (accountTransactions || []).filter((t) => {
        const date = new Date(t.transaction_date);
        return date >= firstDayOfMonth && date <= lastDayOfMonth;
      });

      if (currentMonthTransactions.length > 0) {
        const income = currentMonthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = currentMonthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log(`   ${account.name}: ${currentMonthTransactions.length} transações no mês atual`);
        console.log(`      Receitas: ${income.toFixed(2)}, Despesas: ${expense.toFixed(2)}`);
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

checkActiveAccountFilter();

