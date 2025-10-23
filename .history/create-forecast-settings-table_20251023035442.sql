-- Create account_forecast_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.account_forecast_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    monthly_budget numeric(10,2),
    alert_threshold numeric(5,2) DEFAULT 80.00,
    budget_type text DEFAULT 'flexible' CHECK (budget_type IN ('fixed', 'flexible')),
    auto_adjust boolean DEFAULT true,
    notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_forecast_settings_account_id ON public.account_forecast_settings(account_id);

-- Enable RLS
ALTER TABLE public.account_forecast_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view forecast settings for accounts they own or are members of
DROP POLICY IF EXISTS "Users can view forecast settings for accounts they own or are members of" ON public.account_forecast_settings;
CREATE POLICY "Users can view forecast settings for accounts they own or are members of"
ON public.account_forecast_settings FOR SELECT
TO authenticated
USING (
    account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
        UNION
        SELECT account_id FROM public.account_members WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert forecast settings for accounts they own
DROP POLICY IF EXISTS "Users can insert forecast settings for accounts they own" ON public.account_forecast_settings;
CREATE POLICY "Users can insert forecast settings for accounts they own"
ON public.account_forecast_settings FOR INSERT
TO authenticated
WITH CHECK (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

-- Policy: Users can update forecast settings for accounts they own
DROP POLICY IF EXISTS "Users can update forecast settings for accounts they own" ON public.account_forecast_settings;
CREATE POLICY "Users can update forecast settings for accounts they own"
ON public.account_forecast_settings FOR UPDATE
TO authenticated
USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
) WITH CHECK (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

-- Policy: Users can delete forecast settings for accounts they own
DROP POLICY IF EXISTS "Users can delete forecast settings for accounts they own" ON public.account_forecast_settings;
CREATE POLICY "Users can delete forecast settings for accounts they own"
ON public.account_forecast_settings FOR DELETE
TO authenticated
USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_account_forecast_settings_updated_at ON public.account_forecast_settings;
CREATE TRIGGER update_account_forecast_settings_updated_at
    BEFORE UPDATE ON public.account_forecast_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
