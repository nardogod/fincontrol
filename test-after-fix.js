// Script para testar após corrigir RLS
// Execute com: node test-after-fix.js

const { createClient } = require("@supabase/supabase-js");

// Configurações do Supabase
const supabaseUrl = "https://ncysankyxvwsuwbqmmtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAfterFix() {
  console.log("🔧 TESTANDO APÓS CORREÇÃO DAS POLÍTICAS RLS...");

  try {
    // 1. Testar sem autenticação (deve falhar)
    console.log("🔍 Testando sem autenticação...");

    const { data: transactionsNoAuth, error: transactionsNoAuthError } =
      await supabase.from("transactions").select("*").limit(5);

    if (transactionsNoAuthError) {
      console.log(
        "✅ RLS funcionando - acesso negado sem autenticação:",
        transactionsNoAuthError.message
      );
    } else {
      console.log(
        "⚠️ RLS não está funcionando - dados acessíveis sem autenticação"
      );
    }

    // 2. Testar com autenticação (você precisa fazer login primeiro)
    console.log("\n🔐 Para testar com autenticação:");
    console.log("1. Faça login no sistema web");
    console.log("2. Abra o console do navegador (F12)");
    console.log("3. Execute este código:");
    console.log(`
// Teste no console do navegador após login
const { createClient } = window.supabase || {};
if (createClient) {
  const supabase = createClient('${supabaseUrl}', '${supabaseKey}');
  
  // Testar transações
  supabase.from('transactions').select('*').limit(5).then(({data, error}) => {
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Transações encontradas:', data?.length || 0);
      console.log('📊 Dados:', data);
    }
  });
  
  // Testar contas
  supabase.from('accounts').select('*').then(({data, error}) => {
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Contas encontradas:', data?.length || 0);
      console.log('🏦 Dados:', data);
    }
  });
}
    `);

    // 3. Verificar se as políticas foram aplicadas
    console.log("\n📋 Para verificar as políticas RLS:");
    console.log("Execute no Supabase SQL Editor:");
    console.log(`
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('transactions', 'accounts', 'users', 'account_members')
ORDER BY tablename, policyname;
    `);
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar
testAfterFix();
