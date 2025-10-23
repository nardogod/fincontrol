// Script para criar dados de teste
// Execute com: node create-test-data.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://ncysankyxvwsuwbqmmtj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXNhbmt5eHZ3c3V3YnFtbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA4NTAsImV4cCI6MjA3NjE3Njg1MH0.ZKKnsB3cCN6eJnvCNy3Wqehp9VmgeceXRHo4uwPQRb4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🔧 CRIANDO DADOS DE TESTE...');
  
  try {
    // 1. Buscar usuários existentes
    console.log('👤 Buscando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log('✅ Usuários encontrados:', users?.length || 0);
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado. Você precisa fazer login primeiro.');
      return;
    }
    
    const user = users[0];
    console.log('👤 Usando usuário:', user.email);
    
    // 2. Criar conta de teste
    console.log('🏦 Criando conta de teste...');
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: 'Conta Principal',
        type: 'personal',
        color: '#3B82F6',
        icon: '🏦',
        description: 'Conta principal para testes',
        user_id: user.id
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Erro ao criar conta:', accountError);
      return;
    }
    
    console.log('✅ Conta criada:', account.name);
    
    // 3. Buscar categorias
    console.log('📂 Buscando categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
      return;
    }
    
    console.log('✅ Categorias encontradas:', categories?.length || 0);
    
    // 4. Criar transações de teste
    console.log('💰 Criando transações de teste...');
    
    const testTransactions = [
      {
        type: 'income',
        amount: 5000,
        description: 'Salário mensal',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: account.id,
        category_id: categories.find(c => c.name === 'Salário')?.id,
        created_via: 'web'
      },
      {
        type: 'expense',
        amount: 800,
        description: 'Compras no supermercado',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: account.id,
        category_id: categories.find(c => c.name === 'Alimentação')?.id,
        created_via: 'web'
      },
      {
        type: 'expense',
        amount: 200,
        description: 'Combustível',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: account.id,
        category_id: categories.find(c => c.name === 'Transporte')?.id,
        created_via: 'web'
      },
      {
        type: 'income',
        amount: 1200,
        description: 'Freelance',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: account.id,
        category_id: categories.find(c => c.name === 'Freelance')?.id,
        created_via: 'web'
      },
      {
        type: 'expense',
        amount: 150,
        description: 'Cinema',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: account.id,
        category_id: categories.find(c => c.name === 'Lazer')?.id,
        created_via: 'web'
      }
    ];
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert(testTransactions)
      .select();
    
    if (transactionsError) {
      console.error('❌ Erro ao criar transações:', transactionsError);
      return;
    }
    
    console.log('✅ Transações criadas:', transactions?.length || 0);
    
    // 5. Verificar dados criados
    console.log('\n🔍 VERIFICANDO DADOS CRIADOS...');
    
    const { data: finalTransactions } = await supabase
      .from('transactions')
      .select(`
        id, type, amount, description, transaction_date,
        category:categories(name, icon),
        account:accounts(name)
      `)
      .eq('account_id', account.id);
    
    console.log('📊 Transações na conta:');
    finalTransactions?.forEach((t, index) => {
      console.log(`${index + 1}. ${t.type === 'income' ? '💰' : '💸'} ${t.amount} kr - ${t.category?.name} - ${t.description}`);
    });
    
    // Calcular totais
    const income = finalTransactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const expense = finalTransactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    console.log('\n💰 TOTAIS:');
    console.log(`Receitas: ${income} kr`);
    console.log(`Despesas: ${expense} kr`);
    console.log(`Balanço: ${income - expense} kr`);
    
    console.log('\n🎯 DADOS DE TESTE CRIADOS COM SUCESSO!');
    console.log('Agora você pode testar o dashboard!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
createTestData();
