-- Fix RLS policies for account_forecast_settings to ensure invited users can view settings
-- This ensures that users who are members of shared accounts can see forecast settings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view forecast settings for accounts they own or are members of" ON public.account_forecast_settings;

-- Recreate the SELECT policy with better logic
CREATE POLICY "Users can view forecast settings for accounts they own or are members of"
ON public.account_forecast_settings FOR SELECT
TO authenticated
USING (
    -- User owns the account
    account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
    OR
    -- User is a member of the account
    account_id IN (
        SELECT account_id FROM public.account_members WHERE user_id = auth.uid()
    )
);

-- Verify the policy is correct
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
WHERE tablename = 'account_forecast_settings';

