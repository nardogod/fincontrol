const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransactions() {
  console.log('🔍 Verificando transações no banco...');
  
  // Verificar se há transações
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(5);
    
  if (error) {
    console.log('❌ Erro ao buscar transações:', error);
    return;
  }
  
  console.log('📊 Transações encontradas:', transactions?.length || 0);
  if (transactions && transactions.length > 0) {
    console.log('✅ Primeira transação:', transactions[0]);
  } else {
    console.log('⚠️ Nenhuma transação encontrada no banco');
  }
  
  // Verificar contas
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .limit(5);
    
  console.log('🏦 Contas encontradas:', accounts?.length || 0);
  if (accounts && accounts.length > 0) {
    console.log('✅ Primeira conta:', accounts[0]);
  }
}

debugTransactions().catch(console.error);
