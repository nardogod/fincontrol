-- Adicionar coluna currency à tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'kr' CHECK (currency IN ('kr', 'real', 'dolar', 'euro'));

-- Atualizar contas existentes para ter moeda padrão
UPDATE public.accounts
SET currency = 'kr'
WHERE currency IS NULL;

-- Tornar a coluna currency NOT NULL após definir padrões
ALTER TABLE public.accounts
ALTER COLUMN currency SET NOT NULL;
