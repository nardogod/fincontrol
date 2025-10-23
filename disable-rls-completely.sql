-- Script para desabilitar RLS completamente (TEMPORÁRIO)
-- Execute no Supabase SQL Editor

-- DESABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members DISABLE ROW LEVEL SECURITY;

-- REMOVER TODAS AS POLÍTICAS
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.transactions;

DROP POLICY IF EXISTS "Authenticated users can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can delete accounts" ON public.accounts;

DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;

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
