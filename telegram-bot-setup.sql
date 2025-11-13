-- Tabela para vincular usuários do sistema com Telegram
CREATE TABLE IF NOT EXISTS user_telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, telegram_id)
);

-- Tabela para tokens de autenticação temporários
CREATE TABLE IF NOT EXISTS telegram_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para armazenar sessões temporárias (quando usuário está adicionando transação)
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  session_data JSONB NOT NULL, -- armazena dados temporários da transação
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_telegram_id FOREIGN KEY (telegram_id) REFERENCES user_telegram_links(telegram_id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_telegram_links_telegram_id ON user_telegram_links(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_telegram_links_user_id ON user_telegram_links(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_tokens_token ON telegram_auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_tokens_telegram_id ON telegram_auth_tokens(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_tokens_expires_at ON telegram_auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_telegram_id ON telegram_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_expires_at ON telegram_sessions(expires_at);

-- RLS Policies
ALTER TABLE user_telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes (se houver) antes de criar novas
DROP POLICY IF EXISTS "Users can view own telegram links" ON user_telegram_links;
DROP POLICY IF EXISTS "Users can insert own telegram links" ON user_telegram_links;
DROP POLICY IF EXISTS "Users can update own telegram links" ON user_telegram_links;
DROP POLICY IF EXISTS "Users can delete own telegram links" ON user_telegram_links;
DROP POLICY IF EXISTS "Service role full access to telegram_auth_tokens" ON telegram_auth_tokens;
DROP POLICY IF EXISTS "Service role full access to telegram_sessions" ON telegram_sessions;

-- Usuários podem ver apenas seus próprios links
CREATE POLICY "Users can view own telegram links"
  ON user_telegram_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram links"
  ON user_telegram_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram links"
  ON user_telegram_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram links"
  ON user_telegram_links FOR DELETE
  USING (auth.uid() = user_id);

-- Tokens de autenticação são gerenciados pela API (service role)
CREATE POLICY "Service role full access to telegram_auth_tokens"
  ON telegram_auth_tokens FOR ALL
  USING (true);

-- Sessões são gerenciadas pela API (service role)
CREATE POLICY "Service role full access to telegram_sessions"
  ON telegram_sessions FOR ALL
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_telegram_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente antes de criar
DROP TRIGGER IF EXISTS user_telegram_links_updated_at ON user_telegram_links;

CREATE TRIGGER user_telegram_links_updated_at
  BEFORE UPDATE ON user_telegram_links
  FOR EACH ROW
  EXECUTE FUNCTION update_user_telegram_links_updated_at();

-- Função para limpar sessões expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_telegram_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_telegram_links IS 'Vincula usuários do sistema com IDs do Telegram';
COMMENT ON TABLE telegram_auth_tokens IS 'Tokens temporários para autenticação via web';
COMMENT ON TABLE telegram_sessions IS 'Armazena dados temporários de transações em andamento';

