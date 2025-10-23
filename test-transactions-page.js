// Script para testar transações diretamente na página
// Execute no console da página /transactions

console.log("🧪 TESTANDO TRANSAÇÕES NA PÁGINA...");

// Verificar se estamos na página correta
if (window.location.pathname !== "/transactions") {
  console.log("❌ Você precisa estar na página /transactions");
  console.log("Vá para: http://localhost:3000/transactions");
  return;
}

// Verificar se o componente está carregado
const transactionElements = document.querySelectorAll(
  '[data-testid="transaction-item"]'
);
console.log(
  "📋 Elementos de transação encontrados:",
  transactionElements.length
);

// Verificar se há mensagem de "nenhuma transação"
const noTransactionsMsg = document.querySelector("text-gray-500");
if (
  noTransactionsMsg &&
  noTransactionsMsg.textContent.includes("Nenhuma transação")
) {
  console.log("⚠️ Mensagem 'Nenhuma transação encontrada' está visível");
}

// Verificar filtros
const accountFilter = document.querySelector('select[name="account"]');
const categoryFilter = document.querySelector('select[name="category"]');
const typeFilter = document.querySelector('select[name="type"]');

console.log("🔍 Filtros encontrados:");
console.log("- Filtro de conta:", accountFilter ? "✅" : "❌");
console.log("- Filtro de categoria:", categoryFilter ? "✅" : "❌");
console.log("- Filtro de tipo:", typeFilter ? "✅" : "❌");

// Verificar se há botões de ação
const applyButton = document.querySelector('button[type="submit"]');
const clearButton = document.querySelector('button[type="button"]');

console.log("🔘 Botões encontrados:");
console.log("- Botão Aplicar:", applyButton ? "✅" : "❌");
console.log("- Botão Limpar:", clearButton ? "✅" : "❌");

console.log("✅ TESTE CONCLUÍDO!");
