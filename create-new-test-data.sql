-- Script para criar dados de teste novos
-- Execute no Supabase SQL Editor

-- 1. Criar usuário de teste
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'teste@fincontrol.com',
  'Usuário Teste',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar conta para o usuário
INSERT INTO public.accounts (name, type, color, icon, description, user_id)
VALUES (
  'Conta Principal',
  'personal',
  '#3B82F6',
  '🏦',
  'Conta principal para testes',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- 3. Criar transações de teste
INSERT INTO public.transactions (type, amount, description, transaction_date, account_id, category_id, created_via)
VALUES 
  -- Receitas
  (
    'income',
    5000,
    'Salário mensal',
    CURRENT_DATE,
    (SELECT id FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Salário' LIMIT 1),
    'web'
  ),
  (
    'income',
    1200,
    'Freelance',
    CURRENT_DATE,
    (SELECT id FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Freelance' LIMIT 1),
    'web'
  ),
  -- Despesas
  (
    'expense',
    800,
    'Compras no supermercado',
    CURRENT_DATE,
    (SELECT id FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Alimentação' LIMIT 1),
    'web'
  ),
  (
    'expense',
    200,
    'Combustível',
    CURRENT_DATE,
    (SELECT id FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Transporte' LIMIT 1),
    'web'
  ),
  (
    'expense',
    150,
    'Cinema',
    CURRENT_DATE,
    (SELECT id FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Lazer' LIMIT 1),
    'web'
  );

-- 4. Verificar dados criados
SELECT 'Usuários' as tabela, COUNT(*) as total FROM public.users
UNION ALL
SELECT 'Contas' as tabela, COUNT(*) as total FROM public.accounts
UNION ALL
SELECT 'Transações' as tabela, COUNT(*) as total FROM public.transactions
UNION ALL
SELECT 'Categorias' as tabela, COUNT(*) as total FROM public.categories;

-- 5. Mostrar transações criadas
SELECT 
  t.type,
  t.amount,
  t.description,
  c.name as categoria,
  a.name as conta
FROM public.transactions t
JOIN public.categories c ON t.category_id = c.id
JOIN public.accounts a ON t.account_id = a.id
ORDER BY t.created_at DESC;
