-- Script para adicionar coluna user_id à tabela transactions
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna user_id à tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Atualizar transações existentes com o user_id do proprietário da conta
UPDATE public.transactions 
SET user_id = (
  SELECT a.user_id 
  FROM public.accounts a 
  WHERE a.id = transactions.account_id
)
WHERE user_id IS NULL;

-- 3. Tornar a coluna NOT NULL após popular os dados
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Criar índice para melhor performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);

-- 5. Atualizar políticas RLS para incluir user_id
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their transactions" ON public.transactions;

-- Políticas RLS atualizadas
CREATE POLICY "Users can view their transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'user_id';