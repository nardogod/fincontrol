-- Script para criar estrutura de Contas Fixas (Mensalidades)
-- Execute este script no Supabase SQL Editor

-- 1. Criar categorias "Balanço", "Mensalidades" e "Dívidas"
INSERT INTO public.categories (name, icon, color, type, is_default)
VALUES 
  ('Balanço', '⚖️', '#6366F1', 'expense', true),
  ('Mensalidades', '📅', '#8B5CF6', 'expense', true),
  ('Dívidas', '💳', '#EF4444', 'expense', true)
ON CONFLICT DO NOTHING;

-- 2. Adicionar campos na tabela accounts para contas fixas
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS recurring_category_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS recurring_start_date DATE,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- 3. Criar tabela para rastrear pagamentos de mensalidades
CREATE TABLE IF NOT EXISTS public.recurring_bill_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, month_year)
);

-- 4. Habilitar RLS na tabela recurring_bill_payments
ALTER TABLE public.recurring_bill_payments ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para recurring_bill_payments
DROP POLICY IF EXISTS "Users can view recurring bill payments" ON public.recurring_bill_payments;
CREATE POLICY "Users can view recurring bill payments"
ON public.recurring_bill_payments FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = auth.uid() OR 
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert recurring bill payments" ON public.recurring_bill_payments;
CREATE POLICY "Users can insert recurring bill payments"
ON public.recurring_bill_payments FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = auth.uid() OR 
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update recurring bill payments" ON public.recurring_bill_payments;
CREATE POLICY "Users can update recurring bill payments"
ON public.recurring_bill_payments FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = auth.uid() OR 
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete recurring bill payments" ON public.recurring_bill_payments;
CREATE POLICY "Users can delete recurring bill payments"
ON public.recurring_bill_payments FOR DELETE
USING (
  account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = auth.uid() OR 
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

-- 6. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_recurring_bill_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recurring_bill_payments_updated_at ON public.recurring_bill_payments;
CREATE TRIGGER update_recurring_bill_payments_updated_at
  BEFORE UPDATE ON public.recurring_bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_bill_payments_updated_at();

-- Mensagem de sucesso
SELECT 'Estrutura de Contas Fixas criada com sucesso! 🎉' as message;

