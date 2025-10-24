-- Corrigir políticas RLS para account_invites
-- Permitir que usuários vejam convites pendentes para seu email

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view invites for their email" ON account_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON account_invites;

-- Criar política para permitir visualização de convites por email
CREATE POLICY "Users can view invites for their email" ON account_invites
  FOR SELECT
  USING (invited_email = auth.jwt() ->> 'email');

-- Permitir que usuários aceitem/recusem convites
CREATE POLICY "Users can update invites for their email" ON account_invites
  FOR UPDATE
  USING (invited_email = auth.jwt() ->> 'email');

-- Verificar se a tabela account_invites existe e tem as colunas necessárias
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_invites') THEN
    -- Criar tabela se não existir
    CREATE TABLE account_invites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      invited_email TEXT NOT NULL,
      invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Habilitar RLS
    ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;
    
    -- Criar índices
    CREATE INDEX idx_account_invites_email ON account_invites(invited_email);
    CREATE INDEX idx_account_invites_status ON account_invites(status);
    CREATE INDEX idx_account_invites_account ON account_invites(account_id);
  END IF;
END $$;

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'account_invites';
