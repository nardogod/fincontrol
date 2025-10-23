// Script para verificar dados do dashboard
// Execute com: node check-dashboard-data.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDashboardData() {
  console.log("🔍 VERIFICANDO DADOS DO DASHBOARD...");

  try {
    // 1. Verificar usuários
    console.log("\n👤 USUÁRIOS:");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .limit(5);

    if (usersError) {
      console.error("❌ Erro ao buscar usuários:", usersError.message);
    } else {
      console.log(`✅ Usuários encontrados: ${users?.length || 0}`);
      users?.forEach((user, index) => {
        console.log(
          `  ${index + 1}. ${user.email} (${user.full_name}) - ID: ${user.id}`
        );
      });
    }

    // 2. Verificar contas
    console.log("\n🏦 CONTAS:");
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, type, user_id")
      .limit(10);

    if (accountsError) {
      console.error("❌ Erro ao buscar contas:", accountsError.message);
    } else {
      console.log(`✅ Contas encontradas: ${accounts?.length || 0}`);
      accounts?.forEach((account, index) => {
        console.log(
          `  ${index + 1}. ${account.name} (${account.type}) - User: ${
            account.user_id
          }`
        );
      });
    }

    // 3. Verificar transações
    console.log("\n💰 TRANSAÇÕES:");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date,
        category:categories(name, icon),
        account:accounts(name, user_id)
      `
      )
      .order("transaction_date", { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error("❌ Erro ao buscar transações:", transactionsError.message);
    } else {
      console.log(`✅ Transações encontradas: ${transactions?.length || 0}`);
      transactions?.forEach((transaction, index) => {
        console.log(
          `  ${index + 1}. ${transaction.type === "income" ? "💰" : "💸"} ${
            transaction.amount
          } kr`
        );
        console.log(
          `     Categoria: ${transaction.category?.name || "Sem categoria"}`
        );
        console.log(
          `     Conta: ${transaction.account?.name || "Sem conta"} (User: ${
            transaction.account?.user_id
          })`
        );
        console.log(`     Data: ${transaction.transaction_date}`);
        console.log(
          `     Descrição: ${transaction.description || "Sem descrição"}`
        );
        console.log("     ---");
      });
    }

    // 4. Calcular totais
    if (transactions && transactions.length > 0) {
      console.log("\n📊 CÁLCULO DE TOTAIS:");

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      console.log(`💰 Receitas: ${income} kr`);
      console.log(`💸 Despesas: ${expense} kr`);
      console.log(`⚖️ Balanço: ${income - expense} kr`);

      // 5. Verificar transações por usuário
      console.log("\n👥 TRANSAÇÕES POR USUÁRIO:");
      const userTransactions = {};

      transactions.forEach((t) => {
        const userId = t.account?.user_id;
        if (userId) {
          if (!userTransactions[userId]) {
            userTransactions[userId] = { income: 0, expense: 0, count: 0 };
          }
          userTransactions[userId][t.type] += Number(t.amount);
          userTransactions[userId].count += 1;
        }
      });

      Object.entries(userTransactions).forEach(([userId, totals]) => {
        const user = users?.find((u) => u.id === userId);
        console.log(`  ${user?.email || userId}:`);
        console.log(`    Receitas: ${totals.income} kr`);
        console.log(`    Despesas: ${totals.expense} kr`);
        console.log(`    Total: ${totals.income - totals.expense} kr`);
        console.log(`    Transações: ${totals.count}`);
      });
    }

    // 6. Verificar categorias
    console.log("\n📂 CATEGORIAS:");
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, type, icon")
      .order("name");

    if (categoriesError) {
      console.error("❌ Erro ao buscar categorias:", categoriesError.message);
    } else {
      console.log(`✅ Categorias encontradas: ${categories?.length || 0}`);
      const incomeCategories =
        categories?.filter((c) => c.type === "income") || [];
      const expenseCategories =
        categories?.filter((c) => c.type === "expense") || [];

      console.log(`  💰 Receitas (${incomeCategories.length}):`);
      incomeCategories.forEach((cat) => {
        console.log(`    ${cat.icon} ${cat.name}`);
      });

      console.log(`  💸 Despesas (${expenseCategories.length}):`);
      expenseCategories.forEach((cat) => {
        console.log(`    ${cat.icon} ${cat.name}`);
      });
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
checkDashboardData();
