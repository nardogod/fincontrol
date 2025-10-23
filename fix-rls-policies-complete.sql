-- Script completo para corrigir políticas RLS
-- Execute no Supabase SQL Editor

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.transactions;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.transactions;

-- Accounts
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.accounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.accounts;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.accounts;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.accounts;

-- Users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- Account Members
DROP POLICY IF EXISTS "Users can view account members" ON public.account_members;
DROP POLICY IF EXISTS "Users can create account members" ON public.account_members;
DROP POLICY IF EXISTS "Users can update account members" ON public.account_members;
DROP POLICY IF EXISTS "Users can delete account members" ON public.account_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.account_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.account_members;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.account_members;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.account_members;

-- 2. VERIFICAR SE RLS ESTÁ ATIVO
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS CORRETAS PARA TRANSACTIONS
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

-- 4. CRIAR POLÍTICAS CORRETAS PARA ACCOUNTS
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE USING (user_id = auth.uid());

-- 5. CRIAR POLÍTICAS CORRETAS PARA USERS
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- 6. CRIAR POLÍTICAS PARA ACCOUNT_MEMBERS
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

-- 7. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
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

-- 8. VERIFICAR SE RLS ESTÁ ATIVO
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('transactions', 'accounts', 'users', 'account_members')
ORDER BY tablename;
