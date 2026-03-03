/**
 * Executa a migration recurring_bill_payments no Supabase (PostgreSQL).
 *
 * Uso: npm run db:migrate:recurring-bills
 *
 * Configure no .env.local:
 *   DATABASE_URL=postgresql://postgres.[ref]:[SENHA]@aws-0-[regiao].pooler.supabase.com:6543/postgres
 *
 * Onde obter: Supabase Dashboard → Project Settings → Database → Connection string → URI
 * (use "Session mode" ou "Direct" e substitua [YOUR-PASSWORD] pela senha do banco)
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Carregar .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada no .env.local");
  console.error("");
  console.error("1. Abra Supabase Dashboard → seu projeto → Settings → Database");
  console.error("2. Em 'Connection string' escolha 'URI'");
  console.error("3. Copie a URL e substitua [YOUR-PASSWORD] pela senha do banco");
  console.error("4. Adicione no .env.local:");
  console.error("   DATABASE_URL=postgresql://postgres.xxx:SUA_SENHA@...");
  process.exit(1);
}

/** Divide o SQL em comandos, respeitando $$ ... $$ */
function splitSql(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  let inDollarQuote = false;
  while (i < sql.length) {
    if (!inDollarQuote && sql.substr(i, 2) === "$$") {
      inDollarQuote = true;
      current += sql[i++] + sql[i++];
      while (i < sql.length - 1 && sql.substr(i, 2) !== "$$") {
        current += sql[i++];
      }
      if (i < sql.length) {
        current += sql[i++] + sql[i++];
      }
      inDollarQuote = false;
      continue;
    }
    if (!inDollarQuote && sql[i] === ";") {
      const stmt = current
        .replace(/\n\s*--[^\n]*/g, "\n")
        .trim();
      if (stmt && !stmt.startsWith("--")) {
        statements.push(stmt + ";");
      }
      current = "";
      i++;
      continue;
    }
    current += sql[i++];
  }
  const stmt = current
    .replace(/\n\s*--[^\n]*/g, "\n")
    .trim();
  if (stmt && !stmt.startsWith("--")) {
    statements.push(stmt + (stmt.endsWith(";") ? "" : ";"));
  }
  return statements;
}

async function main() {
  const sqlPath = path.join(__dirname, "..", "create-recurring-bills-structure.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("❌ Arquivo não encontrado:", sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = splitSql(sql).filter((s) => s.trim().length > 1);

  console.log("🚀 Conectando ao Supabase e aplicando migration (recurring_bill_payments)...\n");

  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.slice(0, 60).replace(/\s+/g, " ") + "...";
      try {
        await client.query(stmt);
        console.log("  ✅", preview);
      } catch (err) {
        if (err.code === "42710") {
          console.log("  ⏭️  (já existe)", preview);
        } else if (err.message && err.message.includes("already exists")) {
          console.log("  ⏭️  (já existe)", preview);
        } else {
          console.error("  ❌ Erro:", preview);
          console.error("     ", err.message);
          throw err;
        }
      }
    }
    console.log("\n✅ Estrutura de Contas Fixas (recurring_bill_payments) criada com sucesso.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Falha na migration:", err.message);
  process.exit(1);
});
