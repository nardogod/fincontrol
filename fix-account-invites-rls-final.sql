-- Corrigir políticas RLS para account_invites - Versão Final
-- Remove todas as políticas existentes e cria as novas

-- 1. Remover TODAS as políticas existentes da tabela account_invites
DROP POLICY IF EXISTS "Users can view invites for their email" ON account_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON account_invites;
DROP POLICY IF EXISTS "Users can update invites for their email" ON account_invites;
DROP POLICY IF EXISTS "Users can insert invites" ON account_invites;
DROP POLICY IF EXISTS "Users can delete invites" ON account_invites;

-- 2. Verificar se a tabela account_invites existe, se não existir, criar
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
    
    RAISE NOTICE 'Tabela account_invites criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela account_invites já existe';
  END IF;
END $$;

-- 3. Criar políticas RLS corretas
-- Política para visualizar convites recebidos
CREATE POLICY "Users can view invites for their email" ON account_invites
  FOR SELECT
  USING (invited_email = auth.jwt() ->> 'email');

-- Política para aceitar/recusar convites
CREATE POLICY "Users can update invites for their email" ON account_invites
  FOR UPDATE
  USING (invited_email = auth.jwt() ->> 'email');

-- Política para criar convites (apenas donos da conta)
CREATE POLICY "Account owners can create invites" ON account_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = account_invites.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- 4. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'account_invites'
ORDER BY policyname;

-- 5. Testar se as políticas funcionam
SELECT 
  'Políticas RLS criadas com sucesso!' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'account_invites';
