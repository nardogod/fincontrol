-- Fix DELETE policies for accounts and account_members
-- Execute this in your Supabase SQL Editor

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_members') AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- Drop existing DELETE policies
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete account members" ON public.account_members;

-- Create new DELETE policy for accounts
CREATE POLICY "Users can delete their own accounts" ON public.accounts
FOR DELETE USING (
  user_id = auth.uid() OR 
  id IN (
    SELECT account_id FROM public.account_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Create new DELETE policy for account_members
CREATE POLICY "Users can delete account members" ON public.account_members
FOR DELETE USING (
  user_id = auth.uid() OR
  account_id IN (
    SELECT id FROM public.accounts WHERE user_id = auth.uid()
  ) OR
  account_id IN (
    SELECT account_id FROM public.account_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_members') AND cmd = 'DELETE'
ORDER BY tablename, policyname;
