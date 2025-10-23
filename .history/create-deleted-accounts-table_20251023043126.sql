-- Create deleted_accounts table for account recovery
CREATE TABLE IF NOT EXISTS public.deleted_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_account_id UUID NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    currency TEXT DEFAULT 'kr',
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_recover BOOLEAN DEFAULT true,
    recovery_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_user_id ON public.deleted_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_original_id ON public.deleted_accounts(original_account_id);

-- Enable RLS
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own deleted accounts
DROP POLICY IF EXISTS "Users can view their own deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Users can view their own deleted accounts"
ON public.deleted_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own deleted accounts
DROP POLICY IF EXISTS "Users can insert their own deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Users can insert their own deleted accounts"
ON public.deleted_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own deleted accounts (for recovery)
DROP POLICY IF EXISTS "Users can update their own deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Users can update their own deleted accounts"
ON public.deleted_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own deleted accounts
DROP POLICY IF EXISTS "Users can delete their own deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Users can delete their own deleted accounts"
ON public.deleted_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());
