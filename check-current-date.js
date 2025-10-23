// Script para verificar a data atual do sistema
// Execute com: node check-current-date.js

console.log("🕐 VERIFICANDO DATA ATUAL DO SISTEMA...");

const now = new Date();
console.log(`📅 Data atual: ${now.toISOString()}`);
console.log(`📅 Data local: ${now.toLocaleDateString("pt-BR")}`);
console.log(
  `📅 Mês atual: ${now.getMonth() + 1} (${now.toLocaleDateString("pt-BR", {
    month: "long",
  })})`
);
console.log(`📅 Ano atual: ${now.getFullYear()}`);

// Calcular primeiro e último dia do mês
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

console.log(`\n📅 Primeiro dia do mês: ${firstDayOfMonth.toISOString()}`);
console.log(`📅 Último dia do mês: ${lastDayOfMonth.toISOString()}`);

console.log(`\n🎯 CONCLUSÃO:`);
console.log(
  `O sistema está em ${now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })}`
);
console.log(`Mas as transações estão em outubro 2025`);
console.log(`Por isso o dashboard mostra 0 kr`);

console.log(`\n💡 SOLUÇÕES:`);
console.log(
  `1. Criar transações para ${now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })}`
);
console.log(`2. Alterar as datas das transações existentes para o mês atual`);
console.log(`3. Remover o filtro de data do dashboard`);
