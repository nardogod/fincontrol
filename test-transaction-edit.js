// Script para testar edição de transação
// Execute com: node test-transaction-edit.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactionEdit() {
  console.log("🔧 TESTANDO EDIÇÃO DE TRANSAÇÃO...");

  try {
    // 1. Buscar primeira transação
    console.log("🔍 Buscando primeira transação...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .limit(1);

    if (transactionsError || !transactions || transactions.length === 0) {
      console.error(
        "❌ Nenhuma transação encontrada:",
        transactionsError?.message
      );
      return;
    }

    const transaction = transactions[0];
    console.log(
      `✅ Transação encontrada: ${transaction.type} ${transaction.amount} kr`
    );
    console.log(`🆔 ID: ${transaction.id}`);
    console.log(`📝 Descrição: ${transaction.description}`);
    console.log(`💰 Valor original: ${transaction.amount} kr`);

    // 2. Testar edição
    const newAmount = transaction.amount + 100;
    const newDescription = `Editado em ${new Date().toLocaleString()}`;

    console.log(`\n🔧 Editando transação...`);
    console.log(`💰 Novo valor: ${newAmount} kr`);
    console.log(`📝 Nova descrição: ${newDescription}`);

    const { data: updatedTransaction, error: updateError } = await supabase
      .from("transactions")
      .update({
        amount: newAmount,
        description: newDescription,
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Erro ao editar transação:", updateError.message);
      return;
    }

    console.log("✅ Transação editada com sucesso!");
    console.log(`💰 Valor atualizado: ${updatedTransaction[0]?.amount} kr`);
    console.log(
      `📝 Descrição atualizada: ${updatedTransaction[0]?.description}`
    );

    // 3. Verificar se a edição foi salva
    console.log("\n🔍 Verificando se a edição foi salva...");
    const { data: verifyTransaction, error: verifyError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction.id)
      .single();

    if (verifyError) {
      console.error("❌ Erro ao verificar transação:", verifyError.message);
      return;
    }

    console.log("✅ Verificação concluída:");
    console.log(
      `💰 Valor: ${verifyTransaction.amount} kr (esperado: ${newAmount} kr)`
    );
    console.log(`📝 Descrição: ${verifyTransaction.description}`);

    const success =
      verifyTransaction.amount === newAmount &&
      verifyTransaction.description === newDescription;

    if (success) {
      console.log("🎉 EDIÇÃO FUNCIONOU PERFEITAMENTE!");
    } else {
      console.log("⚠️ EDIÇÃO NÃO FUNCIONOU CORRETAMENTE!");
    }

    // 4. Reverter a edição
    console.log("\n🔄 Revertendo edição...");
    const { error: revertError } = await supabase
      .from("transactions")
      .update({
        amount: transaction.amount,
        description: transaction.description,
      })
      .eq("id", transaction.id);

    if (revertError) {
      console.error("❌ Erro ao reverter:", revertError.message);
    } else {
      console.log("✅ Edição revertida com sucesso!");
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
testTransactionEdit();
