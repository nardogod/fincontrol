-- Add currency column to accounts table if it doesn't exist
DO $$
BEGIN
    -- Check if currency column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND table_schema = 'public'
        AND column_name = 'currency'
    ) THEN
        -- Add currency column
        ALTER TABLE public.accounts 
        ADD COLUMN currency text DEFAULT 'kr' CHECK (currency IN ('kr', 'real', 'dolar', 'euro'));
        
        -- Update existing accounts to have default currency
        UPDATE public.accounts 
        SET currency = 'kr' 
        WHERE currency IS NULL;
        
        -- Make currency column NOT NULL after setting defaults
        ALTER TABLE public.accounts 
        ALTER COLUMN currency SET NOT NULL;
        
        RAISE NOTICE 'Currency column added successfully';
    ELSE
        RAISE NOTICE 'Currency column already exists';
    END IF;
END $$;
