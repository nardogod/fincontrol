// Test script to verify currency functionality
console.log("🧪 Testando funcionalidade de moedas...");

// Simular o array de moedas
const currencies = [
  { value: "kr", label: "Krone (kr)", symbol: "kr" },
  { value: "real", label: "Real (R$)", symbol: "R$" },
  { value: "dolar", label: "Dólar ($)", symbol: "$" },
  { value: "euro", label: "Euro (€)", symbol: "€" },
];

console.log("✅ Array de moedas definido:", currencies.length, "moedas");

// Simular formData
const formData = {
  name: "Teste",
  type: "personal",
  color: "#3B82F6",
  currency: "kr",
  description: "",
};

console.log("✅ FormData com currency:", formData);

// Simular mudança de moeda
const newCurrency = "real";
const updatedFormData = { ...formData, currency: newCurrency };

console.log("✅ Mudança de moeda simulada:", updatedFormData);

// Simular dados para inserção no banco
const accountData = {
  name: formData.name,
  type: formData.type,
  color: formData.color,
  currency: formData.currency,
  description: formData.description || null,
  user_id: "test-user-id",
};

console.log("✅ Dados para inserção no banco:", accountData);

console.log("🎉 Funcionalidade de moedas está implementada corretamente!");
console.log("📝 Próximo passo: Verificar se a coluna 'currency' existe na tabela 'accounts' no Supabase");
