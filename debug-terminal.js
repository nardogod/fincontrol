// Script para executar no terminal do Cursor
// Execute com: node debug-terminal.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://ncysankyxvwsuwbqmmtj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransactions() {
  console.log('🔍 INICIANDO DEBUG NO TERMINAL...');
  
  try {
    // 1. Verificar se conseguimos conectar
    console.log('🔌 Testando conexão com Supabase...');
    
    // 2. Buscar TODAS as transações (sem filtro de usuário)
    console.log('📊 Buscando TODAS as transações...');
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select(`
        id, type, amount, description, transaction_date, created_via,
        category:categories(name, icon),
        account:accounts(name, icon, user_id)
      `)
      .order('transaction_date', { ascending: false });
    
    if (allError) {
      console.error('❌ Erro ao buscar transações:', allError);
      return;
    }
    
    console.log('✅ Transações encontradas:', allTransactions?.length || 0);
    
    if (allTransactions && allTransactions.length > 0) {
      console.log('\n📋 DETALHES DAS TRANSAÇÕES:');
      allTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.type === 'income' ? '💰' : '💸'} ${t.amount} kr`);
        console.log(`   Categoria: ${t.category?.name || 'Sem categoria'}`);
        console.log(`   Conta: ${t.account?.name || 'Sem conta'} (User: ${t.account?.user_id})`);
        console.log(`   Data: ${t.transaction_date}`);
        console.log(`   Descrição: ${t.description || 'Sem descrição'}`);
        console.log(`   Via: ${t.created_via || 'web'}`);
        console.log('---');
      });
      
      // Calcular totais
      const income = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      console.log('\n💰 TOTAIS:');
      console.log(`Receitas: ${income} kr`);
      console.log(`Despesas: ${expense} kr`);
      console.log(`Balanço: ${income - expense} kr`);
    } else {
      console.log('⚠️ Nenhuma transação encontrada');
    }
    
    // 3. Buscar contas
    console.log('\n🏦 Buscando contas...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (accountsError) {
      console.error('❌ Erro ao buscar contas:', accountsError);
    } else {
      console.log('✅ Contas encontradas:', accounts?.length || 0);
      if (accounts && accounts.length > 0) {
        accounts.forEach((account, index) => {
          console.log(`${index + 1}. ${account.name} (${account.type}) - User: ${account.user_id}`);
        });
      }
    }
    
    // 4. Buscar categorias
    console.log('\n📂 Buscando categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
    } else {
      console.log('✅ Categorias encontradas:', categories?.length || 0);
      if (categories && categories.length > 0) {
        categories.forEach((category, index) => {
          console.log(`${index + 1}. ${category.icon} ${category.name} (${category.type})`);
        });
      }
    }
    
    console.log('\n🎯 DEBUG TERMINAL FINALIZADO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
debugTransactions();
