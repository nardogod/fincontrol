#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando deploy manual...");

try {
  // 1. Limpar builds anteriores
  console.log("🧹 Limpando builds anteriores...");
  if (fs.existsSync(".next")) {
    execSync('powershell -Command "Remove-Item -Recurse -Force .next"', {
      stdio: "inherit",
    });
  }
  if (fs.existsSync("out")) {
    execSync('powershell -Command "Remove-Item -Recurse -Force out"', {
      stdio: "inherit",
    });
  }

  // 2. Instalar dependências
  console.log("📦 Instalando dependências...");
  execSync("npm ci", { stdio: "inherit" });

  // 3. Fazer build
  console.log("🔨 Fazendo build...");
  execSync("npx next build --no-lint", { stdio: "inherit" });

  // 4. Verificar se o diretório .next existe
  if (!fs.existsSync(".next")) {
    throw new Error("❌ Diretório .next não foi criado!");
  }

  console.log("✅ Build concluído com sucesso!");
  console.log("📁 Arquivos prontos em: ./.next");
  console.log("");
  console.log("🎯 Para fazer deploy manual no Netlify:");
  console.log("1. Acesse: https://app.netlify.com/sites/fincontrol-app");
  console.log('2. Vá para "Deploys"');
  console.log('3. Clique em "Deploy manually"');
  console.log('4. Arraste a pasta ".next" para a área de deploy');
  console.log("5. Aguarde o deploy ser concluído");
} catch (error) {
  console.error("❌ Erro durante o deploy:", error.message);
  process.exit(1);
}
