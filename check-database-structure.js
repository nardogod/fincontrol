// Script para verificar estrutura do banco
// Execute com: node check-database-structure.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://ncysankyxvwsuwbqmmtj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO...');
  
  try {
    // 1. Verificar tabelas existentes
    console.log('📋 Verificando tabelas...');
    
    const tables = ['users', 'accounts', 'transactions', 'categories', 'account_members'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ERRO - ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK (${data?.length || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ERRO - ${err.message}`);
      }
    }
    
    // 2. Verificar se há dados em auth.users (tabela do Supabase Auth)
    console.log('\n🔐 Verificando autenticação...');
    
    // Tentar buscar dados de auth.users (isso pode não funcionar com anon key)
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(5);
      
      if (authError) {
        console.log('⚠️ Não é possível acessar auth.users com anon key (normal)');
      } else {
        console.log('✅ Usuários de auth:', authUsers?.length || 0);
      }
    } catch (err) {
      console.log('⚠️ Não é possível acessar auth.users com anon key (normal)');
    }
    
    // 3. Verificar se há dados em public.users
    console.log('\n👤 Verificando public.users...');
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (publicUsersError) {
      console.log('❌ Erro ao buscar public.users:', publicUsersError.message);
    } else {
      console.log('✅ Usuários em public.users:', publicUsers?.length || 0);
      if (publicUsers && publicUsers.length > 0) {
        publicUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (${user.full_name})`);
        });
      }
    }
    
    // 4. Verificar contas
    console.log('\n🏦 Verificando contas...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(5);
    
    if (accountsError) {
      console.log('❌ Erro ao buscar contas:', accountsError.message);
    } else {
      console.log('✅ Contas encontradas:', accounts?.length || 0);
      if (accounts && accounts.length > 0) {
        accounts.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.name} (${account.type}) - User: ${account.user_id}`);
        });
      }
    }
    
    // 5. Verificar transações
    console.log('\n💰 Verificando transações...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (transactionsError) {
      console.log('❌ Erro ao buscar transações:', transactionsError.message);
    } else {
      console.log('✅ Transações encontradas:', transactions?.length || 0);
      if (transactions && transactions.length > 0) {
        transactions.forEach((transaction, index) => {
          console.log(`  ${index + 1}. ${transaction.type} ${transaction.amount} kr - ${transaction.description}`);
        });
      }
    }
    
    // 6. Verificar categorias
    console.log('\n📂 Verificando categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.log('❌ Erro ao buscar categorias:', categoriesError.message);
    } else {
      console.log('✅ Categorias encontradas:', categories?.length || 0);
      if (categories && categories.length > 0) {
        categories.forEach((category, index) => {
          console.log(`  ${index + 1}. ${category.icon} ${category.name} (${category.type})`);
        });
      }
    }
    
    console.log('\n🎯 VERIFICAÇÃO DA ESTRUTURA CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
checkDatabaseStructure();
