// Script super simples para verificar transações
// Execute no console do navegador

console.log("🔍 VERIFICANDO TRANSAÇÕES...");

// Função para verificar transações usando fetch direto
const checkTransactions = async () => {
  try {
    // URL do Supabase
    const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
    const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzQsImV4cCI6MjA1MDU1MDg3NH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq";

    // 1. Verificar usuário atual
    console.log("👤 Verificando usuário...");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
    });

    const userData = await userResponse.json();
    console.log("👤 Usuário:", userData);

    if (!userData.user) {
      console.error("❌ Usuário não encontrado");
      return;
    }

    // 2. Buscar contas
    console.log("🏦 Buscando contas...");
    const accountsResponse = await fetch(
      `${supabaseUrl}/rest/v1/accounts?user_id=eq.${userData.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
      }
    );

    const accounts = await accountsResponse.json();
    console.log("🏦 Contas:", accounts);

    if (!accounts || accounts.length === 0) {
      console.error("❌ Nenhuma conta encontrada");
      return;
    }

    // 3. Buscar transações
    console.log("📊 Buscando transações...");
    const accountIds = accounts.map((a) => a.id).join(",");
    const transactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/transactions?account_id=in.(${accountIds})`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
      }
    );

    const transactions = await transactionsResponse.json();
    console.log("📊 Transações:", transactions);

    // 4. Calcular totais
    if (transactions && transactions.length > 0) {
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      console.log("💰 Totais:", {
        income: income,
        expense: expense,
        balance: income - expense,
      });
    }

    console.log("✅ VERIFICAÇÃO CONCLUÍDA!");
  } catch (error) {
    console.error("❌ Erro:", error);
  }
};

// Executar
checkTransactions();
