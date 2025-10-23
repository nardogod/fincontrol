const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserRelation() {
  console.log('🔍 Verificando relação com usuários...');
  
  // Testar query simples de transações
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      user:users(full_name, email)
    `)
    .limit(3);
    
  if (error) {
    console.log('❌ Erro na query:', error);
    return;
  }
  
  console.log('📊 Transações com usuários:', transactions?.length || 0);
  if (transactions && transactions.length > 0) {
    console.log('✅ Primeira transação com user:', {
      id: transactions[0].id,
      description: transactions[0].description,
      user: transactions[0].user
    });
  }
  
  // Verificar se tabela users existe
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (usersError) {
    console.log('❌ Erro ao acessar tabela users:', usersError);
  } else {
    console.log('✅ Tabela users acessível:', users?.length || 0);
  }
}

debugUserRelation().catch(console.error);
