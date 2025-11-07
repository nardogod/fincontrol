// Script para diagnosticar o problema do dashboard para nardogomes@live.com
// Execute com: node debug-nardogomes-dashboard.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNardogomesDashboard() {
  console.log("🔍 DIAGNÓSTICO DO DASHBOARD PARA nardogomes@live.com\n");
  console.log("=".repeat(80));

  try {
    // 1. Verificar se o usuário existe
    console.log("\n1️⃣ VERIFICANDO USUÁRIO...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("email", "nardogomes@live.com")
      .limit(1);

    if (usersError) {
      console.error("❌ Erro ao buscar usuário:", usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.error(
        "❌ Usuário nardogomes@live.com não encontrado na tabela users!"
      );
      console.log("📝 Verifique se o usuário está registrado corretamente.");
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.full_name || "N/A"}`);
    console.log(`   Criado em: ${user.created_at}`);

    // 2. Verificar se o usuário existe no auth.users
    console.log("\n2️⃣ VERIFICANDO AUTH.USERS...");
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(user.id);
    if (authError) {
      console.log(
        `⚠️ Não foi possível verificar auth.users (pode ser normal): ${authError.message}`
      );
    } else if (authUser) {
      console.log(`✅ Usuário existe no auth.users`);
      console.log(`   Email: ${authUser.user.email}`);
    }

    // 3. Buscar contas do usuário (como no dashboard)
    console.log("\n3️⃣ BUSCANDO CONTAS DO USUÁRIO...");
    const { data: userAccounts, error: userAccountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userAccountsError) {
      console.error("❌ Erro ao buscar contas:", userAccountsError.message);
      return;
    }

    console.log(`✅ Contas próprias encontradas: ${userAccounts?.length || 0}`);
    if (userAccounts && userAccounts.length > 0) {
      userAccounts.forEach((account, index) => {
        console.log(
          `   ${index + 1}. ${account.name} (${account.type}) - ID: ${
            account.id
          }`
        );
        console.log(
          `      Ativa: ${account.is_active}, Criada em: ${account.created_at}`
        );
      });
    } else {
      console.log("⚠️ Usuário não tem contas próprias!");
    }

    // 4. Buscar contas compartilhadas (como no dashboard)
    console.log("\n4️⃣ BUSCANDO CONTAS COMPARTILHADAS...");
    const { data: sharedAccounts, error: sharedAccountsError } = await supabase
      .from("account_members")
      .select(
        `
        *,
        account:accounts(
          id,
          name,
          description,
          icon,
          type,
          color,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (sharedAccountsError) {
      console.error(
        "❌ Erro ao buscar contas compartilhadas:",
        sharedAccountsError.message
      );
    } else {
      console.log(
        `✅ Contas compartilhadas encontradas: ${sharedAccounts?.length || 0}`
      );
      if (sharedAccounts && sharedAccounts.length > 0) {
        sharedAccounts.forEach((member, index) => {
          console.log(
            `   ${index + 1}. ${member.account?.name} - Role: ${member.role}`
          );
          console.log(`      Account ID: ${member.account?.id}`);
        });
      }
    }

    // Combinar contas (como no dashboard)
    const userAccountIds = new Set((userAccounts || []).map((acc) => acc.id));
    const sharedAccountData =
      (sharedAccounts || []).map((member) => ({
        ...member.account,
        is_shared: true,
        member_role: member.role,
      })) || [];

    const uniqueSharedAccounts = sharedAccountData.filter(
      (acc) => acc && !userAccountIds.has(acc.id)
    );

    const accounts = [...(userAccounts || []), ...uniqueSharedAccounts];
    console.log(`\n📊 TOTAL DE CONTAS DISPONÍVEIS: ${accounts.length}`);
    console.log(`   - Próprias: ${userAccounts?.length || 0}`);
    console.log(`   - Compartilhadas únicas: ${uniqueSharedAccounts.length}`);

    if (accounts.length === 0) {
      console.log("\n❌ PROBLEMA IDENTIFICADO: Usuário não tem contas!");
      console.log("📝 O dashboard não pode exibir valores sem contas.");
      return;
    }

    // 5. Buscar transações (QUERY EXATA DO DASHBOARD - SEM FILTRO DE DATA)
    console.log("\n5️⃣ BUSCANDO TRANSAÇÕES (QUERY EXATA DO DASHBOARD)...");
    const accountIds = accounts.map((a) => a.id);
    console.log(`   Account IDs: ${accountIds.join(", ")}`);

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        *, 
        category:categories(*), 
        account:accounts(*)
      `
      )
      .in("account_id", accountIds)
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("❌ Erro ao buscar transações:", transactionsError.message);
      console.error("   Detalhes:", transactionsError);

      // Verificar se é problema de RLS
      if (
        transactionsError.message.includes("permission") ||
        transactionsError.message.includes("policy")
      ) {
        console.log("\n⚠️ PROBLEMA DE PERMISSÃO (RLS) DETECTADO!");
        console.log(
          "📝 As políticas RLS podem estar bloqueando o acesso às transações."
        );
      }
      return;
    }

    console.log(`✅ Transações encontradas: ${transactions?.length || 0}`);

    if (!transactions || transactions.length === 0) {
      console.log("\n❌ PROBLEMA IDENTIFICADO: Nenhuma transação encontrada!");
      console.log("📝 Verificando se há transações nas contas do usuário...");

      // Verificar se há transações diretamente nas contas
      for (const account of accounts) {
        const { data: accountTransactions, error: accountError } =
          await supabase
            .from("transactions")
            .select("id, type, amount, transaction_date")
            .eq("account_id", account.id)
            .limit(5);

        if (accountError) {
          console.log(
            `   ❌ Erro ao verificar transações da conta ${account.name}: ${accountError.message}`
          );
        } else {
          console.log(
            `   Conta ${account.name}: ${
              accountTransactions?.length || 0
            } transações`
          );
        }
      }

      return;
    }

    // 6. Analisar transações encontradas
    console.log("\n6️⃣ ANALISANDO TRANSAÇÕES...");
    const incomeTransactions = transactions.filter((t) => t.type === "income");
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense"
    );

    console.log(`   Receitas: ${incomeTransactions.length} transações`);
    console.log(`   Despesas: ${expenseTransactions.length} transações`);

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );
    const totalExpense = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );
    const balance = totalIncome - totalExpense;

    console.log(`\n💰 TOTAIS QUE DEVERIAM APARECER NO DASHBOARD:`);
    console.log(`   Receitas: ${totalIncome.toFixed(2)}`);
    console.log(`   Despesas: ${totalExpense.toFixed(2)}`);
    console.log(`   Balanço: ${balance.toFixed(2)}`);

    // 7. Verificar transações por conta
    console.log("\n7️⃣ TRANSAÇÕES POR CONTA:");
    accounts.forEach((account) => {
      const accountTransactions = transactions.filter(
        (t) => t.account_id === account.id
      );
      const accountIncome = accountTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const accountExpense = accountTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      console.log(`   ${account.name}:`);
      console.log(`      Transações: ${accountTransactions.length}`);
      console.log(`      Receitas: ${accountIncome.toFixed(2)}`);
      console.log(`      Despesas: ${accountExpense.toFixed(2)}`);
      console.log(
        `      Balanço: ${(accountIncome - accountExpense).toFixed(2)}`
      );
    });

    // 8. Verificar se as transações têm dados válidos
    console.log("\n8️⃣ VERIFICANDO INTEGRIDADE DOS DADOS...");
    const invalidTransactions = transactions.filter(
      (t) => !t.amount || isNaN(Number(t.amount)) || Number(t.amount) === 0
    );

    if (invalidTransactions.length > 0) {
      console.log(
        `⚠️ Transações com valores inválidos: ${invalidTransactions.length}`
      );
      invalidTransactions.slice(0, 5).forEach((t) => {
        console.log(`   ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}`);
      });
    } else {
      console.log("✅ Todas as transações têm valores válidos");
    }

    // 9. Verificar se há problema com RLS simulando autenticação
    console.log("\n9️⃣ VERIFICANDO RLS (Row Level Security)...");
    console.log(
      "   Nota: Este script usa a chave anon, então pode não refletir o comportamento real"
    );
    console.log("   com RLS ativo. O problema pode estar nas políticas RLS.");

    // 10. Resumo final
    console.log("\n" + "=".repeat(80));
    console.log("📋 RESUMO DO DIAGNÓSTICO:");
    console.log("=".repeat(80));

    if (accounts.length === 0) {
      console.log("❌ PROBLEMA: Usuário não tem contas");
      console.log("💡 SOLUÇÃO: Criar pelo menos uma conta para o usuário");
    } else if (!transactions || transactions.length === 0) {
      console.log("❌ PROBLEMA: Nenhuma transação encontrada");
      console.log(
        "💡 SOLUÇÃO: Verificar se há transações no banco e se RLS permite acesso"
      );
    } else if (totalIncome === 0 && totalExpense === 0) {
      console.log("❌ PROBLEMA: Transações existem mas valores são zero");
      console.log(
        "💡 SOLUÇÃO: Verificar se os valores das transações estão corretos"
      );
    } else {
      console.log("✅ DADOS ENCONTRADOS:");
      console.log(`   - Contas: ${accounts.length}`);
      console.log(`   - Transações: ${transactions.length}`);
      console.log(`   - Receitas: ${totalIncome.toFixed(2)}`);
      console.log(`   - Despesas: ${totalExpense.toFixed(2)}`);
      console.log(`   - Balanço: ${balance.toFixed(2)}`);
      console.log("\n⚠️ Se os valores não aparecem no dashboard, verifique:");
      console.log(
        "   1. Se o componente FinancialSummary está recebendo as transações"
      );
      console.log("   2. Se hideValues está definido como false");
      console.log("   3. Se há erros no console do navegador");
      console.log("   4. Se RLS está bloqueando o acesso quando autenticado");
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
    console.error("Stack:", error.stack);
  }
}

// Executar
debugNardogomesDashboard();
