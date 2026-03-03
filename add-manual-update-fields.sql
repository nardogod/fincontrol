-- Add manual update fields to account_forecast_settings table
-- These fields store static values when user clicks "Update Forecast"

ALTER TABLE public.account_forecast_settings
ADD COLUMN IF NOT EXISTS last_manual_update timestamp with time zone,
ADD COLUMN IF NOT EXISTS manual_current_week_spent numeric(10,2),
ADD COLUMN IF NOT EXISTS manual_current_month_spent numeric(10,2),
ADD COLUMN IF NOT EXISTS manual_remaining_this_month numeric(10,2),
ADD COLUMN IF NOT EXISTS manual_projected_monthly_total numeric(10,2),
ADD COLUMN IF NOT EXISTS manual_progress_percentage numeric(5,2),
ADD COLUMN IF NOT EXISTS manual_status text,
ADD COLUMN IF NOT EXISTS manual_status_message text;

-- Add comment to explain the fields
COMMENT ON COLUMN public.account_forecast_settings.last_manual_update IS 'Timestamp of last manual forecast update';
COMMENT ON COLUMN public.account_forecast_settings.manual_current_week_spent IS 'Static value: Gasto Esta Semana at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_current_month_spent IS 'Static value: Gasto atual do mês at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_remaining_this_month IS 'Static value: Restante Este Mês at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_projected_monthly_total IS 'Static value: Projeção Mensal at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_progress_percentage IS 'Static value: Progresso do Mês (%) at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_status IS 'Static value: Status (on-track, over-budget, etc.) at time of manual update';
COMMENT ON COLUMN public.account_forecast_settings.manual_status_message IS 'Static value: Status message (e.g., "Bom trabalho!") at time of manual update';

