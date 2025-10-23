const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando deploy manual...");

try {
  // 1. Limpar diretórios
  console.log("🧹 Limpando diretórios...");
  if (fs.existsSync(".next")) {
    fs.rmSync(".next", { recursive: true, force: true });
  }
  if (fs.existsSync("out")) {
    fs.rmSync("out", { recursive: true, force: true });
  }

  // 2. Build com --debug
  console.log("🔨 Fazendo build...");
  execSync("npx next build --debug", { stdio: "inherit" });

  // 3. Verificar se build foi bem-sucedido
  if (!fs.existsSync(".next")) {
    throw new Error("Build falhou - diretório .next não encontrado");
  }

  console.log("✅ Build concluído com sucesso!");
  console.log("📁 Diretório .next criado");
  console.log("🌐 Agora você pode fazer upload manual para Netlify");
} catch (error) {
  console.error("❌ Erro no deploy:", error.message);
  process.exit(1);
}
