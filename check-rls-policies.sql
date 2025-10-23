-- Script para verificar políticas RLS
-- Execute no Supabase SQL Editor

-- 1. Verificar políticas para a tabela transactions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 2. Verificar políticas para a tabela accounts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'accounts'
ORDER BY policyname;

-- 3. Verificar políticas para a tabela users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 4. Verificar se RLS está ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('transactions', 'accounts', 'users')
ORDER BY tablename;