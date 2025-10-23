-- Check if currency column exists in accounts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND table_schema = 'public'
AND column_name = 'currency';

-- If the above query returns no rows, run the following:
-- ALTER TABLE public.accounts ADD COLUMN currency text DEFAULT 'kr' CHECK (currency IN ('kr', 'real', 'dolar', 'euro'));
