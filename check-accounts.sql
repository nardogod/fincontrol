-- Check accounts and account_members in Supabase
-- Execute this in your Supabase SQL Editor

-- Check all accounts
SELECT 
  id,
  user_id,
  name,
  type,
  color,
  description,
  is_active,
  created_at
FROM public.accounts 
ORDER BY created_at DESC;

-- Check all account members
SELECT 
  am.id,
  am.account_id,
  am.user_id,
  am.role,
  am.created_at,
  a.name as account_name,
  u.full_name as user_name
FROM public.account_members am
LEFT JOIN public.accounts a ON am.account_id = a.id
LEFT JOIN public.users u ON am.user_id = u.id
ORDER BY am.created_at DESC;

-- Check if there are any accounts without members
SELECT 
  a.id,
  a.name,
  a.user_id,
  a.created_at
FROM public.accounts a
LEFT JOIN public.account_members am ON a.id = am.account_id
WHERE am.id IS NULL;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_members')
ORDER BY tablename, policyname;
