-- Script para desabilitar RLS temporariamente (APENAS PARA TESTE)
-- Execute no Supabase SQL Editor

-- DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members DISABLE ROW LEVEL SECURITY;

-- VERIFICAR STATUS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('transactions', 'accounts', 'users', 'account_members')
ORDER BY tablename;

-- TESTAR ACESSO
SELECT 'Transações' as tabela, COUNT(*) as total FROM public.transactions
UNION ALL
SELECT 'Contas' as tabela, COUNT(*) as total FROM public.accounts
UNION ALL
SELECT 'Usuários' as tabela, COUNT(*) as total FROM public.users
UNION ALL
SELECT 'Membros' as tabela, COUNT(*) as total FROM public.account_members;
