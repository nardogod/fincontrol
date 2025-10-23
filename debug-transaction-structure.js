const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransactionStructure() {
  console.log('🔍 Verificando estrutura da tabela transactions...');
  
  // Verificar estrutura da transação
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('❌ Erro:', error);
    return;
  }
  
  if (transactions && transactions.length > 0) {
    console.log('✅ Estrutura da transação:', Object.keys(transactions[0]));
    console.log('📊 Transação completa:', transactions[0]);
  }
  
  // Verificar se existe user_id
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (usersError) {
    console.log('❌ Tabela users não existe ou não acessível:', usersError);
  } else {
    console.log('✅ Tabela users existe');
  }
}

debugTransactionStructure().catch(console.error);
