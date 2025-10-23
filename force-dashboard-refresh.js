// Script para forçar atualização do dashboard
// Execute no console do navegador (F12 → Console)

console.log("🔄 FORÇANDO ATUALIZAÇÃO DO DASHBOARD...");

// 1. Limpar cache do navegador
if ("caches" in window) {
  caches.keys().then(function (names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log("✅ Cache limpo");
  });
}

// 2. Recarregar a página
console.log("🔄 Recarregando página...");
window.location.reload();

// 3. Se não recarregar automaticamente, execute:
// window.location.href = '/dashboard';
