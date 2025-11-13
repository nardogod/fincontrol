-- ============================================
-- SCRIPT PARA ADICIONAR COLUNAS DE CONTA FIXA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar colunas de conta fixa na tabela accounts
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS recurring_category_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS recurring_start_date DATE,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'accounts'
  AND column_name IN ('is_recurring', 'recurring_amount', 'recurring_category_id', 'recurring_start_date', 'recurring_end_date')
ORDER BY column_name;

-- Mensagem de sucesso
SELECT 'Colunas de conta fixa adicionadas com sucesso! 🎉' as message;

