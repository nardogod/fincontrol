-- Add currency column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'kr' CHECK (currency IN ('kr', 'real', 'dolar', 'euro'));

-- Update existing accounts to have default currency
UPDATE public.accounts 
SET currency = 'kr' 
WHERE currency IS NULL;

-- Make currency column NOT NULL after setting defaults
ALTER TABLE public.accounts 
ALTER COLUMN currency SET NOT NULL;
