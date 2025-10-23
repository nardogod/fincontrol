// Script para testar o comando "add" no sistema de chat
// Execute este script no console do navegador

console.log("🧪 Testando sistema de chat com comando 'add'");

// Simular mensagem de chat
const testMessage = "add 1000 freelancer";

console.log("📝 Mensagem de teste:", testMessage);

// Parser de mensagens (copiado do código)
const parseMessage = (text) => {
  const lowerText = text.toLowerCase();
  console.log("🔍 Parsing text:", lowerText);

  // Padrões para receitas com "add"
  const incomePatterns = [
    /(?:add|adicionar|receita|entrada)\s+(\d+(?:[.,]\d+)?)\s+(\w+)/i,
    /(?:add|adicionar|receita|entrada)\s+(\d+(?:[.,]\d+)?)/i,
  ];

  // Tentar padrões de receita
  for (const pattern of incomePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      console.log("✅ Income pattern match:", match);
      const amount = parseFloat(match[1].replace(",", "."));
      const category = match[2] || "salário";
      console.log("💰 Extracted - amount:", amount, "category:", category);

      if (!isNaN(amount)) {
        return {
          type: "income",
          amount,
          category: category.toLowerCase(),
          description: text,
        };
      }
    }
  }

  return null;
};

// Testar o parser
const result = parseMessage(testMessage);
console.log("🎯 Resultado do parsing:", result);

if (result) {
  console.log("✅ Comando 'add' funcionando!");
  console.log("📊 Dados extraídos:");
  console.log("  - Tipo:", result.type);
  console.log("  - Valor:", result.amount);
  console.log("  - Categoria:", result.category);
  console.log("  - Descrição:", result.description);
} else {
  console.log("❌ Comando 'add' não foi reconhecido");
}
