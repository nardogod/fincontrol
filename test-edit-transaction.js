// Script para testar edição de transação
// Execute no console do navegador

console.log("🧪 TESTANDO EDIÇÃO DE TRANSAÇÃO");

const testEditTransaction = async () => {
  try {
    // Importar Supabase
    const { createClient } = await import(
      "https://cdn.skypack.dev/@supabase/supabase-js@2"
    );
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Buscar usuário atual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("❌ Usuário não encontrado:", userError);
      return;
    }
    console.log("👤 Usuário:", user.email);

    // 2. Buscar primeira transação do usuário
    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (!accounts || accounts.length === 0) {
      console.error("❌ Nenhuma conta encontrada");
      return;
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accounts[0].id)
      .limit(1);

    if (!transactions || transactions.length === 0) {
      console.error("❌ Nenhuma transação encontrada");
      return;
    }

    const transaction = transactions[0];
    console.log("📝 Transação encontrada:", {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
    });

    // 3. Testar edição
    const newAmount = transaction.amount + 50;
    const newDescription = `Editado em ${new Date().toLocaleString()}`;

    console.log("🔧 Editando transação...");
    const { data: updatedTransaction, error: updateError } = await supabase
      .from("transactions")
      .update({
        amount: newAmount,
        description: newDescription,
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Erro ao editar:", updateError);
      return;
    }

    console.log("✅ Transação editada com sucesso:", updatedTransaction);

    // 4. Verificar se a edição foi salva
    const { data: verifyTransaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction.id)
      .single();

    console.log("🔍 Verificação:", {
      original: {
        amount: transaction.amount,
        description: transaction.description,
      },
      updated: {
        amount: verifyTransaction.amount,
        description: verifyTransaction.description,
      },
      success:
        verifyTransaction.amount === newAmount &&
        verifyTransaction.description === newDescription,
    });
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
};

// Executar teste
testEditTransaction();
