const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando build limpo...");

try {
  // 1. Criar diretório temporário
  const tempDir = path.join(__dirname, "temp-build");
  console.log("📁 Criando diretório temporário:", tempDir);

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 2. Copiar arquivos essenciais
  console.log("📋 Copiando arquivos...");
  const filesToCopy = [
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.ts",
    "tsconfig.json",
    "postcss.config.js",
    "components.json",
    "app",
    "public",
    "middleware.ts",
  ];

  filesToCopy.forEach((file) => {
    const src = path.join(__dirname, file);
    const dest = path.join(tempDir, file);

    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log("✅ Copiado:", file);
    } else {
      console.log("⚠️ Não encontrado:", file);
    }
  });

  // 3. Instalar dependências no diretório temporário
  console.log("📦 Instalando dependências...");
  process.chdir(tempDir);
  execSync("npm ci", { stdio: "inherit" });

  // 4. Build no diretório temporário
  console.log("🔨 Fazendo build...");
  execSync("npm run build", { stdio: "inherit" });

  // 5. Copiar resultado de volta
  console.log("📁 Copiando resultado...");
  const buildResult = path.join(tempDir, ".next");
  const finalResult = path.join(__dirname, ".next");

  if (fs.existsSync(finalResult)) {
    fs.rmSync(finalResult, { recursive: true, force: true });
  }

  if (fs.existsSync(buildResult)) {
    fs.cpSync(buildResult, finalResult, { recursive: true });
    console.log("✅ Build concluído com sucesso!");
    console.log("📁 Diretório .next criado em:", finalResult);
  } else {
    throw new Error("Build falhou - diretório .next não encontrado");
  }

  // 6. Limpar diretório temporário
  console.log("🧹 Limpando diretório temporário...");
  process.chdir(__dirname);
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (error) {
  console.error("❌ Erro no build limpo:", error.message);
  process.exit(1);
}
