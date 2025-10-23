// Script para sincronizar usuários do auth.users para public.users
// Execute com: node sync-users.js

const { createClient } = require("@supabase/supabase-js");

// Configurações do Supabase
const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncUsers() {
  console.log("🔄 SINCRONIZANDO USUÁRIOS...");

  try {
    // 1. Verificar se há usuários em public.users
    console.log("👤 Verificando usuários em public.users...");
    const { data: existingUsers, error: existingError } = await supabase
      .from("users")
      .select("*");

    if (existingError) {
      console.error("❌ Erro ao buscar usuários existentes:", existingError);
      return;
    }

    console.log(
      "✅ Usuários existentes em public.users:",
      existingUsers?.length || 0
    );

    // 2. Como não podemos acessar auth.users diretamente, vamos criar um usuário de teste
    console.log("🔧 Criando usuário de teste...");

    const testUser = {
      id: "00000000-0000-0000-0000-000000000001", // UUID de teste
      email: "teste@fincontrol.com",
      full_name: "Usuário Teste",
      phone: "+5511999999999",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error("❌ Erro ao criar usuário de teste:", userError);
      return;
    }

    console.log("✅ Usuário de teste criado:", newUser.email);

    // 3. Criar conta para o usuário de teste
    console.log("🏦 Criando conta para o usuário de teste...");

    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        name: "Conta Principal",
        type: "personal",
        color: "#3B82F6",
        icon: "🏦",
        description: "Conta principal",
        user_id: newUser.id,
      })
      .select()
      .single();

    if (accountError) {
      console.error("❌ Erro ao criar conta:", accountError);
      return;
    }

    console.log("✅ Conta criada:", account.name);

    // 4. Buscar categorias
    console.log("📂 Buscando categorias...");
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*");

    if (categoriesError) {
      console.error("❌ Erro ao buscar categorias:", categoriesError);
      return;
    }

    console.log("✅ Categorias encontradas:", categories?.length || 0);

    // 5. Criar transações de teste
    console.log("💰 Criando transações de teste...");

    const testTransactions = [
      {
        type: "income",
        amount: 5000,
        description: "Salário mensal",
        transaction_date: new Date().toISOString().split("T")[0],
        account_id: account.id,
        category_id: categories.find((c) => c.name === "Salário")?.id,
        created_via: "web",
      },
      {
        type: "expense",
        amount: 800,
        description: "Compras no supermercado",
        transaction_date: new Date().toISOString().split("T")[0],
        account_id: account.id,
        category_id: categories.find((c) => c.name === "Alimentação")?.id,
        created_via: "web",
      },
      {
        type: "expense",
        amount: 200,
        description: "Combustível",
        transaction_date: new Date().toISOString().split("T")[0],
        account_id: account.id,
        category_id: categories.find((c) => c.name === "Transporte")?.id,
        created_via: "web",
      },
      {
        type: "income",
        amount: 1200,
        description: "Freelance",
        transaction_date: new Date().toISOString().split("T")[0],
        account_id: account.id,
        category_id: categories.find((c) => c.name === "Freelance")?.id,
        created_via: "web",
      },
      {
        type: "expense",
        amount: 150,
        description: "Cinema",
        transaction_date: new Date().toISOString().split("T")[0],
        account_id: account.id,
        category_id: categories.find((c) => c.name === "Lazer")?.id,
        created_via: "web",
      },
    ];

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .insert(testTransactions)
      .select();

    if (transactionsError) {
      console.error("❌ Erro ao criar transações:", transactionsError);
      return;
    }

    console.log("✅ Transações criadas:", transactions?.length || 0);

    // 6. Verificar dados criados
    console.log("\n🔍 VERIFICANDO DADOS CRIADOS...");

    const { data: finalTransactions } = await supabase
      .from("transactions")
      .select(
        `
        id, type, amount, description, transaction_date,
        category:categories(name, icon),
        account:accounts(name)
      `
      )
      .eq("account_id", account.id);

    console.log("📊 Transações na conta:");
    finalTransactions?.forEach((t, index) => {
      console.log(
        `${index + 1}. ${t.type === "income" ? "💰" : "💸"} ${t.amount} kr - ${
          t.category?.name
        } - ${t.description}`
      );
    });

    // Calcular totais
    const income =
      finalTransactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const expense =
      finalTransactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    console.log("\n💰 TOTAIS:");
    console.log(`Receitas: ${income} kr`);
    console.log(`Despesas: ${expense} kr`);
    console.log(`Balanço: ${income - expense} kr`);

    console.log("\n🎯 DADOS DE TESTE CRIADOS COM SUCESSO!");
    console.log("Agora você pode testar o dashboard!");
    console.log("\n📝 NOTA: Para usar com seu usuário real, você precisa:");
    console.log("1. Fazer login no sistema");
    console.log(
      "2. O sistema deve criar automaticamente o usuário em public.users"
    );
    console.log("3. Ou executar este script com o ID do seu usuário real");
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
syncUsers();
