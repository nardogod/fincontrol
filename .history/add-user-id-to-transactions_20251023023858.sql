-- Adicionar campo user_id à tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Atualizar transações existentes com o user_id do proprietário da conta
UPDATE transactions 
SET user_id = accounts.user_id
FROM accounts 
WHERE transactions.account_id = accounts.id 
AND transactions.user_id IS NULL;

-- Adicionar RLS policy para user_id
CREATE POLICY "Users can view transactions they created" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view transactions from their accounts" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view transactions from shared accounts" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_members 
      WHERE account_members.account_id = transactions.account_id 
      AND account_members.user_id = auth.uid()
    )
  );
