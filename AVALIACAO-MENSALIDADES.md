# Avaliação: Sistema de Mensalidades e Contas Fixas

## 1. Correções Imediatas

### 1.1. Corrigir "transaçãoões" → "transações"

- **Localização**: `app/components/FinancialSummary.tsx` linha 311
- **Ação**: Substituir texto

## 2. Criar Categorias Padrão

### 2.1. Categoria "Balanço"

- **Tipo**: `expense` ou `income` (pode ser ambos?)
- **Ícone**: 💰 ou ⚖️
- **Cor**: #6366F1 (indigo)
- **Ação**: Inserir no banco via SQL ou criar interface de admin

### 2.2. Categoria "Mensalidades"

- **Tipo**: `expense`
- **Ícone**: 📅 ou 💳
- **Cor**: #8B5CF6 (purple)
- **Ação**: Inserir no banco via SQL

## 3. Estrutura de Dados para Contas Fixas

### 3.1. Modificar Tabela `accounts`

Adicionar campos:

```sql
ALTER TABLE public.accounts
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurring_amount DECIMAL(10,2),
ADD COLUMN recurring_category_id UUID REFERENCES public.categories(id);
```

### 3.2. Criar Tabela `recurring_bill_payments`

```sql
CREATE TABLE public.recurring_bill_payments (
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
```

**RLS Policies**:

```sql
-- Users can view payments for their accounts
CREATE POLICY "Users can view recurring bill payments"
ON public.recurring_bill_payments FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

-- Users can update payments for their accounts
CREATE POLICY "Users can update recurring bill payments"
ON public.recurring_bill_payments FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);
```

## 4. Interface de Usuário

### 4.1. Formulário de Criação/Edição de Conta

**Localização**: `app/accounts/new/page.tsx` e `app/accounts/[id]/settings/page.tsx`

**Adicionar**:

- Checkbox: "Conta Fixa (Mensalidade)"
- Campo condicional: Valor mensal (aparece quando checkbox marcado)
- Campo condicional: Categoria (padrão: "Mensalidades")

### 4.2. Aba "Mensalidades" no Dashboard

**Localização**: `app/components/Dashboard.tsx`

**Estrutura**:

- Nova seção abaixo dos gráficos
- Lista de contas fixas do mês atual
- Checkbox para marcar como paga
- Ao marcar como paga:
  - Cria transação automaticamente (tipo: expense)
  - Atualiza `recurring_bill_payments` (is_paid = true, paid_date = hoje)
  - Deduz do balanço normalmente

**Componente**: `app/components/RecurringBills.tsx` (novo)

### 4.3. Integração na Criação de Transação

**Localização**: `app/components/TransactionForm.tsx`

**Lógica**:

- Se a conta selecionada for `is_recurring = true`:
  - Sugerir categoria "Mensalidades" automaticamente
  - Mostrar badge indicando "Conta Fixa"
  - Ao salvar, verificar se já existe pagamento para este mês
  - Se não existir, criar registro em `recurring_bill_payments`

## 5. Lógica de Negócio

### 5.1. Cálculo de Mensalidades Pendentes

```typescript
// Para cada conta com is_recurring = true
// Verificar se existe pagamento para o mês atual em recurring_bill_payments
// Se não existir ou is_paid = false, mostrar como pendente
```

### 5.2. Marcar como Paga

```typescript
// 1. Criar transação automaticamente:
//    - type: "expense"
//    - amount: account.recurring_amount
//    - category_id: account.recurring_category_id ou categoria "Mensalidades"
//    - account_id: account.id
//    - transaction_date: hoje
//    - description: `Mensalidade ${account.name} - ${monthYear}`

// 2. Criar/Atualizar recurring_bill_payments:
//    - account_id: account.id
//    - month_year: YYYY-MM atual
//    - is_paid: true
//    - paid_date: hoje
//    - transaction_id: ID da transação criada
```

### 5.3. Desmarcar como Paga

```typescript
// 1. Deletar transação associada (se existir)
// 2. Atualizar recurring_bill_payments:
//    - is_paid: false
//    - paid_date: null
//    - transaction_id: null
```

## 6. Considerações de Implementação

### 6.1. Simplicidade

- Manter lógica direta: checkbox → criar transação → atualizar status
- Não criar sistema complexo de recorrências automáticas
- Usuário controla quando marca como paga

### 6.2. Histórico

- Manter histórico de pagamentos em `recurring_bill_payments`
- Permitir visualizar meses anteriores
- Mostrar quais meses foram pagos e quais estão pendentes

### 6.3. Multi-conta

- Funciona com contas compartilhadas
- Cada membro pode ver mensalidades
- Apenas owner pode marcar como paga? (decidir)

## 7. Ordem de Implementação

1. ✅ Corrigir "transaçãoões"
2. ✅ Criar categorias "Balanço" e "Mensalidades" (SQL)
3. ✅ Adicionar campos na tabela `accounts` (SQL)
4. ✅ Criar tabela `recurring_bill_payments` (SQL)
5. ✅ Atualizar tipos TypeScript
6. ✅ Adicionar campos no formulário de conta
7. ✅ Criar componente `RecurringBills.tsx`
8. ✅ Integrar no Dashboard
9. ✅ Integrar na criação de transação
10. ✅ Testar fluxo completo

## 8. SQL Scripts Necessários

### Script 1: Criar Categorias

```sql
-- Criar categoria "Balanço" (expense)
INSERT INTO public.categories (name, icon, color, type, is_default)
VALUES ('Balanço', '⚖️', '#6366F1', 'expense', true)
ON CONFLICT DO NOTHING;

-- Criar categoria "Mensalidades" (expense)
INSERT INTO public.categories (name, icon, color, type, is_default)
VALUES ('Mensalidades', '📅', '#8B5CF6', 'expense', true)
ON CONFLICT DO NOTHING;
```

### Script 2: Modificar Tabela Accounts

```sql
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS recurring_category_id UUID REFERENCES public.categories(id);
```

### Script 3: Criar Tabela Recurring Bill Payments

```sql
CREATE TABLE IF NOT EXISTS public.recurring_bill_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, month_year)
);

-- RLS Policies
ALTER TABLE public.recurring_bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring bill payments"
ON public.recurring_bill_payments FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert recurring bill payments"
ON public.recurring_bill_payments FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update recurring bill payments"
ON public.recurring_bill_payments FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete recurring bill payments"
ON public.recurring_bill_payments FOR DELETE
USING (
  account_id IN (
    SELECT id FROM public.accounts
    WHERE user_id = auth.uid() OR
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  )
);
```

## 9. Próximos Passos

Aguardar autorização do usuário para implementar.
