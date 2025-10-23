// Script para testar inserção de transação diretamente
// Execute no console do navegador

console.log("🧪 TESTANDO INSERÇÃO DE TRANSAÇÃO...");

// Dados de teste
const testTransaction = {
  type: "expense",
  amount: 15,
  category_id: "8b91cf7a-8ac0-4c78-90a2-a02a95763f8b",
  account_id: "59f94ee8-6bdd-41b5-bb1f-dbf8719cd11a",
  description: "gasto mercado 15",
  transaction_date: new Date().toISOString().split("T")[0],
  created_via: "chat",
};

console.log("📝 Dados da transação:", testTransaction);

// Tentar inserir
const { data, error } = await supabase
  .from("transactions")
  .insert(testTransaction)
  .select()
  .single();

console.log("📊 Resultado:", { data, error });

if (error) {
  console.error("❌ ERRO COMPLETO:", JSON.stringify(error, null, 2));
  console.error("❌ Detalhes:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
} else {
  console.log("✅ SUCESSO! Transação criada:", data);
}
