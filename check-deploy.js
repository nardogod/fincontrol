#!/usr/bin/env node

const https = require("https");
const { execSync } = require("child_process");

console.log("🔍 Verificando status do deploy...\n");

// Verificar último commit
try {
  const lastCommit = execSync("git log --oneline -1", {
    encoding: "utf8",
  }).trim();
  console.log("📝 Último commit:", lastCommit);
} catch (error) {
  console.log("❌ Erro ao verificar commit:", error.message);
}

// Verificar se há mudanças pendentes
try {
  const status = execSync("git status --porcelain", { encoding: "utf8" });
  if (status.trim()) {
    console.log("⚠️  Há mudanças não commitadas:");
    console.log(status);
  } else {
    console.log("✅ Nenhuma mudança pendente");
  }
} catch (error) {
  console.log("❌ Erro ao verificar status:", error.message);
}

// Verificar branch atual
try {
  const branch = execSync("git branch --show-current", {
    encoding: "utf8",
  }).trim();
  console.log("🌿 Branch atual:", branch);
} catch (error) {
  console.log("❌ Erro ao verificar branch:", error.message);
}

console.log("\n📋 Próximos passos:");
console.log("1. Acesse: https://github.com/nardogod/fincontrol/actions");
console.log("2. Verifique se o workflow está executando");
console.log("3. Aguarde 2-5 minutos para o deploy");
console.log("4. Teste o site em produção");

console.log("\n🚀 Para forçar novo deploy:");
console.log(
  'git commit --allow-empty -m "Force deploy" && git push origin main'
);
