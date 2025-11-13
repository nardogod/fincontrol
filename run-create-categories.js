/**
 * Script para executar create-categories.sql no Supabase
 * Execute: node run-create-categories.js
 *
 * IMPORTANTE: Configure as variáveis de ambiente antes de executar:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Tentar ler .env.local se existir
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("❌ Erro: NEXT_PUBLIC_SUPABASE_URL não encontrada!");
  console.error("Certifique-se de que está configurada no .env.local");
  process.exit(1);
}

// Usar service_role_key se disponível (bypass RLS), senão usar anon_key
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey || ""
);

if (!supabaseServiceKey) {
  console.warn(
    "⚠️  AVISO: Usando ANON_KEY. Se houver erro de RLS, você precisará:"
  );
  console.warn(
    "   1. Executar o script SQL diretamente no Supabase SQL Editor"
  );
  console.warn("   2. Ou configurar SUPABASE_SERVICE_ROLE_KEY no .env.local\n");
}

async function createCategories() {
  console.log("🚀 Iniciando criação de categorias...\n");

  try {
    // SQL para criar categorias
    const sql = `
      INSERT INTO public.categories (name, icon, color, type, is_default)
      VALUES 
        ('Balanço', '⚖️', '#6366F1', 'expense', true),
        ('Mensalidades', '📅', '#8B5CF6', 'expense', true),
        ('Dívidas', '💳', '#EF4444', 'expense', true)
      ON CONFLICT DO NOTHING;
    `;

    // Executar via RPC ou query direta
    // Como não temos função RPC, vamos usar insert direto
    const categories = [
      {
        name: "Balanço",
        icon: "⚖️",
        color: "#6366F1",
        type: "expense",
        is_default: true,
      },
      {
        name: "Mensalidades",
        icon: "📅",
        color: "#8B5CF6",
        type: "expense",
        is_default: true,
      },
      {
        name: "Dívidas",
        icon: "💳",
        color: "#EF4444",
        type: "expense",
        is_default: true,
      },
    ];

    console.log("📝 Criando categorias...");

    for (const category of categories) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category.name)
        .eq("type", category.type)
        .limit(1)
        .single();

      if (existing) {
        console.log(`ℹ️  Categoria "${category.name}" já existe, pulando...`);
        continue;
      }

      // Criar categoria
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select();

      if (error) {
        console.error(
          `❌ Erro ao criar categoria "${category.name}":`,
          error.message
        );
      } else {
        console.log(`✅ Categoria "${category.name}" criada com sucesso!`);
      }
    }

    console.log("\n✅ Processo concluído!");
    console.log("\nCategorias criadas:");
    console.log("  - Balanço (⚖️)");
    console.log("  - Mensalidades (📅)");
    console.log("  - Dívidas (💳)");
  } catch (error) {
    console.error("❌ Erro ao executar script:", error);
    process.exit(1);
  }
}

createCategories();
