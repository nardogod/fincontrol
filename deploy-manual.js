#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando deploy manual via Netlify CLI...");
console.log(
  "⚠️  REGRA DO PROJETO: Deploy SEMPRE manual via terminal do Cursor"
);
console.log("❌ NÃO há deploy automático neste projeto\n");

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

  // 2. Tentar fechar processos Node.js de forma segura (com timeout curto)
  // Se falhar, continuar mesmo assim (não é crítico)
  console.log(
    "🛑 Tentando fechar processos Node.js que possam estar bloqueando arquivos..."
  );
  try {
    if (process.platform === "win32") {
      // Usar timeout muito curto (2 segundos) para não travar
      execSync(
        'powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"',
        {
          stdio: "pipe",
          timeout: 2000, // 2 segundos máximo
        }
      );
      console.log("✅ Processos Node.js fechados (se houver)\n");
    } else {
      execSync("pkill -f node 2>/dev/null || true", {
        stdio: "pipe",
        timeout: 2000, // 2 segundos máximo
      });
      console.log("✅ Processos Node.js fechados (se houver)\n");
    }
  } catch (error) {
    // Ignorar erros - não é crítico
    console.log(
      "⚠️  Não foi possível fechar processos Node.js (continuando mesmo assim)\n"
    );
  }

  // Aguardar um pouco para processos terminarem
  console.log("⏳ Aguardando 2 segundos para processos terminarem...");
  try {
    execSync('powershell -Command "Start-Sleep -Seconds 2"', {
      stdio: "pipe",
      timeout: 3000,
    });
  } catch (error) {
    // Ignorar se falhar
  }
  console.log("✅ Pronto para continuar\n");

  // 3. Limpar builds anteriores
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
      execSync(
        'powershell -Command "Start-Sleep -Seconds 1; Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"',
        {
          stdio: "pipe",
        }
      );
      console.log("✅ Limpeza concluída\n");
    } catch (error) {
      console.log("⚠️  Não foi possível limpar .next completamente");
      console.log("   Tentando continuar mesmo assim...\n");
    }
  } else {
    console.log("✅ Nenhum build anterior encontrado\n");
  }
  if (fs.existsSync("out")) {
    try {
      execSync(
        'powershell -Command "Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue"',
        {
          stdio: "pipe",
        }
      );
    } catch (error) {
      // Ignorar erros de permissão
    }
  }
  console.log("✅ Limpeza concluída\n");

  // 4. Instalar dependências (se necessário)
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

  // 5. Fazer build (usar versão local do Next.js)
  console.log("🔨 Fazendo build de produção...");
  console.log(
    "⚠️  Se o build travar, pressione Ctrl+C e tente novamente após fechar processos Node.js\n"
  );

  const isWindows = process.platform === "win32";
  const nextBin = isWindows ? "next.cmd" : "next";
  const nextPath = path.join(process.cwd(), "node_modules", ".bin", nextBin);

  try {
    if (fs.existsSync(nextPath)) {
      execSync(`"${nextPath}" build`, {
        stdio: "inherit",
        cwd: process.cwd(),
        timeout: 300000, // 5 minutos de timeout
      });
    } else {
      // Fallback: usar npm run build
      execSync("npm run build", {
        stdio: "inherit",
        cwd: process.cwd(),
        timeout: 300000, // 5 minutos de timeout
      });
    }

    // 6. Verificar se o diretório .next existe
    if (!fs.existsSync(".next")) {
      throw new Error("❌ Diretório .next não foi criado!");
    }
    console.log("✅ Build concluído com sucesso!\n");
  } catch (error) {
    if (error.signal === "SIGTERM" || error.code === "TIMEOUT") {
      console.error("\n❌ Build foi cancelado ou excedeu o tempo limite");
      console.error("💡 Dica: Feche processos Node.js e tente novamente");
      process.exit(1);
    }
    throw error;
  }

  // 7. Fazer deploy no Netlify
  // IMPORTANTE: Para Next.js App Router, o Netlify precisa processar o build
  // com o plugin @netlify/plugin-nextjs. Vamos fazer o deploy sem --no-build
  // mas o Netlify vai detectar que o build já existe e processar corretamente.
  console.log("🚀 Fazendo deploy no Netlify...");
  console.log("📝 Site: fincontrol-app");
  console.log("⚠️  O Netlify vai processar o build com o plugin Next.js\n");

  // Fazer deploy sem --no-build para que o plugin do Next.js processe corretamente
  // O Netlify vai detectar que o build já existe e usar o plugin
  const deployOutput = execSync("netlify deploy --prod", {
    stdio: "pipe",
    encoding: "utf-8",
  });

  console.log(deployOutput);

  // Extrair URL do deploy
  const productionUrlMatch = deployOutput.match(
    /Deployed to production URL: (https?:\/\/[^\s]+)/
  );
  const uniqueUrlMatch = deployOutput.match(
    /Unique deploy URL:\s+(https?:\/\/[^\s]+)/
  );

  if (productionUrlMatch) {
    console.log("\n✅ Deploy concluído com sucesso!");
    console.log(`🌐 URL de produção: ${productionUrlMatch[1]}`);
    if (uniqueUrlMatch) {
      console.log(`🔗 URL única do deploy: ${uniqueUrlMatch[1]}`);
    }
  } else {
    console.log("\n✅ Deploy concluído!");
    console.log(
      "🌐 Verifique o status em: https://app.netlify.com/sites/fincontrol-app"
    );
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
