-- Fix RLS policy for account creation
-- Execute this in your Supabase SQL Editor

-- Add missing policy for account_members INSERT
CREATE POLICY "Users can create account members" ON public.account_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'account_members' AND cmd = 'INSERT';
