#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando deploy manual via Netlify CLI...");
console.log("⚠️  REGRA DO PROJETO: Deploy sempre manual via terminal do Cursor\n");

try {
  // 1. Verificar se Netlify CLI está instalado
  console.log("🔍 Verificando Netlify CLI...");
  try {
    execSync("netlify --version", { stdio: "pipe" });
    console.log("✅ Netlify CLI encontrado\n");
  } catch (error) {
    console.error("❌ Netlify CLI não encontrado!");
    console.log("📦 Instalando Netlify CLI globalmente...");
    execSync("npm install -g netlify-cli", { stdio: "inherit" });
    console.log("✅ Netlify CLI instalado\n");
  }

  // 2. Limpar builds anteriores
  console.log("🧹 Limpando builds anteriores...");
  if (fs.existsSync(".next")) {
    try {
      // Tentar remover arquivos específicos primeiro
      const traceFile = path.join(".next", "trace");
      if (fs.existsSync(traceFile)) {
        try {
          fs.unlinkSync(traceFile);
        } catch (e) {
          // Ignorar se não conseguir remover
        }
      }
      // Tentar remover o diretório
      execSync('powershell -Command "Start-Sleep -Seconds 1; Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"', {
        stdio: "pipe",
      });
    } catch (error) {
      console.log("⚠️  Não foi possível limpar .next completamente (pode estar em uso)");
      console.log("   Continuando mesmo assim...\n");
    }
  }
  if (fs.existsSync("out")) {
    try {
      execSync('powershell -Command "Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue"', {
        stdio: "pipe",
      });
    } catch (error) {
      // Ignorar erros de permissão
    }
  }
  console.log("✅ Limpeza concluída\n");

  // 3. Instalar dependências (se necessário)
  console.log("📦 Verificando dependências...");
  if (!fs.existsSync("node_modules")) {
    console.log("📦 Instalando dependências...");
    try {
      execSync("npm ci", { stdio: "inherit" });
    } catch (error) {
      console.log("⚠️  npm ci falhou, tentando npm install...");
      execSync("npm install", { stdio: "inherit" });
    }
    console.log("✅ Dependências instaladas\n");
  } else {
    console.log("✅ Dependências já instaladas\n");
  }

  // 4. Fazer build (usar versão local do Next.js)
  console.log("🔨 Fazendo build de produção...");
  const isWindows = process.platform === "win32";
  const nextBin = isWindows ? "next.cmd" : "next";
  const nextPath = path.join(process.cwd(), "node_modules", ".bin", nextBin);
  
  if (fs.existsSync(nextPath)) {
    execSync(`"${nextPath}" build`, { stdio: "inherit", cwd: process.cwd() });
  } else {
    // Fallback: usar npm run build
    execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
  }

  // 5. Verificar se o diretório .next existe
  if (!fs.existsSync(".next")) {
    throw new Error("❌ Diretório .next não foi criado!");
  }
  console.log("✅ Build concluído com sucesso!\n");

  // 6. Fazer deploy no Netlify (sem rebuild)
  console.log("🚀 Fazendo deploy no Netlify...");
  console.log("📝 Site: fincontrol-app\n");
  
  const deployOutput = execSync("netlify deploy --prod --dir=.next --no-build", {
    stdio: "pipe",
    encoding: "utf-8",
  });

  console.log(deployOutput);

  // Extrair URL do deploy
  const productionUrlMatch = deployOutput.match(/Deployed to production URL: (https?:\/\/[^\s]+)/);
  const uniqueUrlMatch = deployOutput.match(/Unique deploy URL:\s+(https?:\/\/[^\s]+)/);
  
  if (productionUrlMatch) {
    console.log("\n✅ Deploy concluído com sucesso!");
    console.log(`🌐 URL de produção: ${productionUrlMatch[1]}`);
    if (uniqueUrlMatch) {
      console.log(`🔗 URL única do deploy: ${uniqueUrlMatch[1]}`);
    }
  } else {
    console.log("\n✅ Deploy concluído!");
    console.log("🌐 Verifique o status em: https://app.netlify.com/sites/fincontrol-app");
  }
} catch (error) {
  console.error("\n❌ Erro durante o deploy:", error.message);
  if (error.stdout) {
    console.error("Output:", error.stdout);
  }
  if (error.stderr) {
    console.error("Erro:", error.stderr);
  }
  process.exit(1);
}
