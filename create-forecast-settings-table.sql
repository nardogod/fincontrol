-- Criar tabela para configurações de previsão de gastos
CREATE TABLE IF NOT EXISTS account_forecast_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  monthly_budget DECIMAL(10,2) NULL, -- Orçamento mensal personalizado
  alert_threshold INTEGER DEFAULT 80, -- Percentual para alerta (1-100)
  budget_type TEXT DEFAULT 'flexible' CHECK (budget_type IN ('fixed', 'flexible')), -- Tipo de orçamento
  auto_adjust BOOLEAN DEFAULT true, -- Se deve ajustar automaticamente
  notifications_enabled BOOLEAN DEFAULT true, -- Se notificações estão ativas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada conta tenha apenas uma configuração
  UNIQUE(account_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_account_forecast_settings_account_id ON account_forecast_settings(account_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_forecast_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forecast_settings_updated_at
  BEFORE UPDATE ON account_forecast_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_forecast_settings_updated_at();

-- Habilitar RLS
ALTER TABLE account_forecast_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver e editar apenas suas próprias configurações
CREATE POLICY "Users can manage their own forecast settings" ON account_forecast_settings
  FOR ALL USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE account_forecast_settings IS 'Configurações de previsão de gastos por conta';
COMMENT ON COLUMN account_forecast_settings.monthly_budget IS 'Orçamento mensal personalizado em kr';
COMMENT ON COLUMN account_forecast_settings.alert_threshold IS 'Percentual (1-100) para disparar alertas';
COMMENT ON COLUMN account_forecast_settings.budget_type IS 'Tipo: fixed (fixo) ou flexible (baseado no histórico)';
COMMENT ON COLUMN account_forecast_settings.auto_adjust IS 'Se deve ajustar estimativas automaticamente';
COMMENT ON COLUMN account_forecast_settings.notifications_enabled IS 'Se notificações de alerta estão ativas';
