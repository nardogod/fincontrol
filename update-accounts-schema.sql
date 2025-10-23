-- Update accounts table to support new account types
-- Execute this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Add the new constraint with all account types
ALTER TABLE public.accounts ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('personal', 'shared', 'business', 'vehicle'));

-- Add description column if it doesn't exist
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS description TEXT;

-- Add icon column if it doesn't exist
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏦';

-- Update existing accounts to have the new default type
UPDATE public.accounts SET type = 'personal' WHERE type IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND table_schema = 'public';
