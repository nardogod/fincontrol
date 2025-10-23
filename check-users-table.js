// Script para verificar estrutura da tabela users
// Execute com: node check-users-table.js

const { createClient } = require("@supabase/supabase-js");

// Configurações do Supabase
const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
  console.log("🔍 VERIFICANDO ESTRUTURA DA TABELA USERS...");

  try {
    // 1. Tentar inserir um usuário com campos mínimos
    console.log("🔧 Testando inserção com campos mínimos...");

    const testUser = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "teste@fincontrol.com",
      full_name: "Usuário Teste",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error("❌ Erro ao criar usuário:", userError);
      console.log("📋 Campos tentados:", Object.keys(testUser));

      // Tentar com apenas id e email
      console.log("\n🔧 Testando com apenas id e email...");
      const minimalUser = {
        id: "00000000-0000-0000-0000-000000000002",
        email: "teste2@fincontrol.com",
      };

      const { data: minimalUserResult, error: minimalError } = await supabase
        .from("users")
        .insert(minimalUser)
        .select()
        .single();

      if (minimalError) {
        console.error("❌ Erro com campos mínimos:", minimalError);
      } else {
        console.log("✅ Usuário criado com campos mínimos:", minimalUserResult);
      }
    } else {
      console.log("✅ Usuário criado com sucesso:", newUser);
    }

    // 2. Verificar estrutura da tabela tentando diferentes campos
    console.log("\n📋 Testando diferentes campos...");

    const testFields = [
      "id",
      "email",
      "full_name",
      "phone",
      "created_at",
      "updated_at",
      "user_id",
      "name",
      "avatar_url",
      "metadata",
    ];

    for (const field of testFields) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select(field)
          .limit(1);

        if (error) {
          console.log(`❌ Campo ${field}: ${error.message}`);
        } else {
          console.log(`✅ Campo ${field}: OK`);
        }
      } catch (err) {
        console.log(`❌ Campo ${field}: ${err.message}`);
      }
    }

    // 3. Tentar buscar todos os campos
    console.log("\n🔍 Tentando buscar todos os campos...");
    const { data: allFields, error: allFieldsError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (allFieldsError) {
      console.error("❌ Erro ao buscar todos os campos:", allFieldsError);
    } else {
      console.log(
        "✅ Campos disponíveis:",
        allFields?.length > 0 ? Object.keys(allFields[0]) : "Nenhum registro"
      );
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
checkUsersTable();
