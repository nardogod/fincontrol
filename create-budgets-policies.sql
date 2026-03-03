-- Policies para tabela budgets: metas mensais por conta
-- Execute este script no Supabase SQL Editor

-- Garantir que a tabela existe (estrutura básica já definida em supabase-schema.sql)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  planned_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, category_id, month_year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas, se houver
DROP POLICY IF EXISTS "Users can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage budgets" ON public.budgets;

-- Usuários podem ver budgets das contas que possuem ou são membros
CREATE POLICY "Users can view budgets"
  ON public.budgets
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
      UNION
      SELECT account_id FROM public.account_members WHERE user_id = auth.uid()
    )
  );

-- Usuários podem criar/atualizar budgets das contas que possuem
CREATE POLICY "Users can manage budgets"
  ON public.budgets
  FOR ALL
  TO authenticated
  USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

SELECT 'Policies de budgets aplicadas.' AS status;

