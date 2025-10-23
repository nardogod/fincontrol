-- Script para corrigir políticas RLS
-- Execute no Supabase SQL Editor

-- 1. Remover políticas existentes problemáticas
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

-- 2. Criar políticas corretas para transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Criar políticas corretas para accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE USING (user_id = auth.uid());

-- 4. Criar políticas corretas para users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- 5. Criar políticas para account_members
CREATE POLICY "Users can view account members" ON public.account_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create account members" ON public.account_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update account members" ON public.account_members
  FOR UPDATE USING (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete account members" ON public.account_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- 6. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('transactions', 'accounts', 'users', 'account_members')
ORDER BY tablename, policyname;