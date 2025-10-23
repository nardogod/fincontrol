-- Script para criar transações do mês atual (Janeiro 2025)
-- Execute no Supabase SQL Editor

-- 1. Criar transações para o mês atual (Janeiro 2025)
INSERT INTO public.transactions (type, amount, description, transaction_date, account_id, category_id, created_via)
VALUES 
  -- Receitas de Janeiro 2025
  (
    'income',
    5000,
    'Salário Janeiro 2025',
    '2025-01-05',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Salário' LIMIT 1),
    'web'
  ),
  (
    'income',
    800,
    'Freelance Janeiro',
    '2025-01-15',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Freelance' LIMIT 1),
    'web'
  ),
  -- Despesas de Janeiro 2025
  (
    'expense',
    1200,
    'Aluguel Janeiro',
    '2025-01-01',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Moradia' LIMIT 1),
    'web'
  ),
  (
    'expense',
    450,
    'Supermercado Janeiro',
    '2025-01-10',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Alimentação' LIMIT 1),
    'web'
  ),
  (
    'expense',
    200,
    'Combustível Janeiro',
    '2025-01-12',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Transporte' LIMIT 1),
    'web'
  ),
  (
    'expense',
    150,
    'Cinema Janeiro',
    '2025-01-18',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Lazer' LIMIT 1),
    'web'
  ),
  (
    'expense',
    300,
    'Farmácia Janeiro',
    '2025-01-20',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Saúde' LIMIT 1),
    'web'
  ),
  (
    'expense',
    100,
    'Roupas Janeiro',
    '2025-01-25',
    (SELECT id FROM public.accounts WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296' AND name = 'Conta Principal' LIMIT 1),
    (SELECT id FROM public.categories WHERE name = 'Roupas' LIMIT 1),
    'web'
  );

-- 2. Verificar transações criadas
SELECT 
  t.type,
  t.amount,
  t.description,
  t.transaction_date,
  c.name as categoria,
  a.name as conta
FROM public.transactions t
JOIN public.categories c ON t.category_id = c.id
JOIN public.accounts a ON t.account_id = a.id
WHERE t.transaction_date >= '2025-01-01' 
  AND t.transaction_date <= '2025-01-31'
ORDER BY t.transaction_date DESC;

-- 3. Calcular totais do mês atual
SELECT 
  'Receitas' as tipo,
  SUM(amount) as total
FROM public.transactions 
WHERE type = 'income' 
  AND transaction_date >= '2025-01-01' 
  AND transaction_date <= '2025-01-31'
  AND account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296'
  )
UNION ALL
SELECT 
  'Despesas' as tipo,
  SUM(amount) as total
FROM public.transactions 
WHERE type = 'expense' 
  AND transaction_date >= '2025-01-01' 
  AND transaction_date <= '2025-01-31'
  AND account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = 'b1f2b2d9-6859-42d0-a927-b650581dc296'
  );
