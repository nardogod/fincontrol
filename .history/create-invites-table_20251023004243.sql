-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS account_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'owner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_account_invites_email ON account_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_account_invites_account ON account_invites(account_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_status ON account_invites(status);
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON account_invites(token);

-- RLS Policies
ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

-- Política para o usuário que criou o convite
CREATE POLICY "Users can view invites they created" ON account_invites
  FOR SELECT USING (auth.uid() = invited_by);

-- Política para o usuário convidado (por email)
CREATE POLICY "Invited users can view their invites" ON account_invites
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Política para inserir convites (apenas membros da conta)
CREATE POLICY "Account members can create invites" ON account_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_members 
      WHERE account_id = account_invites.account_id 
      AND user_id = auth.uid()
    )
  );

-- Política para atualizar status (apenas o usuário convidado)
CREATE POLICY "Invited users can update invite status" ON account_invites
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_account_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_account_invites_updated_at
  BEFORE UPDATE ON account_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_account_invites_updated_at();
