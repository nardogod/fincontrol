-- Script SQL simples para criar dados de teste
-- Execute no Supabase SQL Editor

-- 1. Verificar se há usuários em auth.users
SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data
FROM auth.users 
LIMIT 5;

-- 2. Se houver usuários, criar dados para o primeiro usuário
-- (Substitua o ID pelo ID real do seu usuário)

-- Exemplo: Se seu usuário tem ID 'abc123-def456-ghi789'
-- Descomente e substitua o ID abaixo:

/*
-- Criar conta
INSERT INTO public.accounts (name, type, color, icon, description, user_id)
VALUES (
  'Conta Principal',
  'personal',
  '#3B82F6',
  '🏦',
  'Conta principal',
  'SEU_USER_ID_AQUI'  -- Substitua pelo ID real
);

-- Criar transações
INSERT INTO public.transactions (type, amount, description, transaction_date, account_id, category_id, created_via)
VALUES 
  ('income', 5000, 'Salário mensal', CURRENT_DATE, 
   (SELECT id FROM public.accounts WHERE user_id = 'SEU_USER_ID_AQUI' LIMIT 1),
   (SELECT id FROM public.categories WHERE name = 'Salário' LIMIT 1),
   'web'),
  ('expense', 800, 'Supermercado', CURRENT_DATE,
   (SELECT id FROM public.accounts WHERE user_id = 'SEU_USER_ID_AQUI' LIMIT 1),
   (SELECT id FROM public.categories WHERE name = 'Alimentação' LIMIT 1),
   'web'),
  ('expense', 200, 'Combustível', CURRENT_DATE,
   (SELECT id FROM public.accounts WHERE user_id = 'SEU_USER_ID_AQUI' LIMIT 1),
   (SELECT id FROM public.categories WHERE name = 'Transporte' LIMIT 1),
   'web');
*/

-- 3. Verificar dados existentes
SELECT 'Usuários em auth.users' as tabela, COUNT(*) as total FROM auth.users
UNION ALL
SELECT 'Usuários em public.users' as tabela, COUNT(*) as total FROM public.users
UNION ALL
SELECT 'Contas' as tabela, COUNT(*) as total FROM public.accounts
UNION ALL
SELECT 'Transações' as tabela, COUNT(*) as total FROM public.transactions
UNION ALL
SELECT 'Categorias' as tabela, COUNT(*) as total FROM public.categories;
