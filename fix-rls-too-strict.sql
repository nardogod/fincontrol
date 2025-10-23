-- Script para corrigir RLS muito restritivo
-- Execute no Supabase SQL Editor

-- 1. REMOVER POLÍTICAS MUITO RESTRITIVAS
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- 2. CRIAR POLÍTICAS MAIS PERMISSIVAS (TEMPORÁRIAS)
-- Para transactions - permitir acesso a usuários autenticados
CREATE POLICY "Authenticated users can view transactions" ON public.transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update transactions" ON public.transactions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete transactions" ON public.transactions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Para accounts - permitir acesso a usuários autenticados
CREATE POLICY "Authenticated users can view accounts" ON public.accounts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update accounts" ON public.accounts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete accounts" ON public.accounts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Para users - permitir acesso a usuários autenticados
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert users" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update users" ON public.users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('transactions', 'accounts', 'users')
ORDER BY tablename, policyname;

-- 4. TESTAR ACESSO
SELECT 'Transações' as tabela, COUNT(*) as total FROM public.transactions
UNION ALL
SELECT 'Contas' as tabela, COUNT(*) as total FROM public.accounts
UNION ALL
SELECT 'Usuários' as tabela, COUNT(*) as total FROM public.users;
