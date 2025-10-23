// Script para testar com autenticação
// Execute com: node test-with-auth.js

const { createClient } = require("@supabase/supabase-js");

// Configurações do Supabase
const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuth() {
  console.log("🔐 TESTANDO COM AUTENTICAÇÃO...");

  try {
    // 1. Tentar fazer login (você precisa fornecer email e senha)
    console.log("🔑 Tentando fazer login...");

    // Substitua pelos seus dados reais
    const email = "seu-email@exemplo.com"; // SUBSTITUA PELO SEU EMAIL
    const password = "sua-senha"; // SUBSTITUA PELA SUA SENHA

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      console.error("❌ Erro ao fazer login:", authError.message);
      console.log("💡 Dica: Substitua email e senha no script");
      return;
    }

    console.log("✅ Login realizado com sucesso!");
    console.log("👤 Usuário:", authData.user.email);

    // 2. Agora tentar buscar dados
    console.log("📊 Buscando transações...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date,
        category:categories(name, icon),
        account:accounts(name)
      `
      )
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("❌ Erro ao buscar transações:", transactionsError);
    } else {
      console.log("✅ Transações encontradas:", transactions?.length || 0);

      if (transactions && transactions.length > 0) {
        console.log("\n📋 Transações:");
        transactions.forEach((t, index) => {
          console.log(
            `${index + 1}. ${t.type === "income" ? "💰" : "💸"} ${
              t.amount
            } kr - ${t.category?.name} - ${t.description}`
          );
        });

        // Calcular totais
        const income = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log("\n💰 TOTAIS:");
        console.log(`Receitas: ${income} kr`);
        console.log(`Despesas: ${expense} kr`);
        console.log(`Balanço: ${income - expense} kr`);
      }
    }

    // 3. Buscar contas
    console.log("\n🏦 Buscando contas...");
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*");

    if (accountsError) {
      console.error("❌ Erro ao buscar contas:", accountsError);
    } else {
      console.log("✅ Contas encontradas:", accounts?.length || 0);
      if (accounts && accounts.length > 0) {
        accounts.forEach((account, index) => {
          console.log(`${index + 1}. ${account.name} (${account.type})`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
testWithAuth();
