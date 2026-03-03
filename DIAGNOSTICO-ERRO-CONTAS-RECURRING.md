# Diagnóstico: Erro ao abrir a aba Contas (recurring_bill_payments 404)

## Onde o erro parte

1. **Origem da chamada**
   - O 404 e a mensagem "Erro ao calcular total de contas fixas não pagas" vêm do hook **`useUnpaidRecurringBillsTotal()`** em `app/hooks/useRecurringBills.ts` (linha ~259).

2. **Quem usa esse hook**
   - **`SpendingForecast`** (`app/components/SpendingForecast.tsx`) — usado só no **Dashboard** para o bloco "Previsão de gastos" e "Restante este mês".
   - **Página Mensalidades** (`app/recurring-bills/page.tsx`).

3. **Por que parece “ao abrir Contas”**
   - Após o login você cai no **Dashboard**.
   - O Dashboard monta o **SpendingForecast** → o **`useUnpaidRecurringBillsTotal()`** roda e dispara a requisição a `recurring_bill_payments`.
   - Se você clica em **Contas** logo em seguida, a requisição ainda está em andamento (ou acaba de retornar).
   - Quando o Supabase responde **404** (tabela inexistente), o erro é tratado no hook e a mensagem aparece no console **nesse momento** — por isso parece que “ao abrir Contas” o sistema falha, mas o gatilho é o **Dashboard** que acabou de carregar.

4. **A aba Contas em si**
   - A página **Contas** (`app/accounts/page.tsx`) **não** usa `useRecurringBills` nem `useUnpaidRecurringBillsTotal`.
   - Nenhum componente da rota `/accounts` chama a tabela `recurring_bill_payments`.
   - Ou seja: o erro não “parte” da aba Contas; ele é disparado pelo hook que roda no Dashboard (e em Mensalidades) e aparece no console quando a resposta 404 chega, muitas vezes já com você na Contas.

## Causa raiz

- A tabela **`recurring_bill_payments`** não existe no projeto Supabase em uso (a migration não foi executada).
- O código sempre chamou essa tabela no Dashboard (via SpendingForecast) e em Mensalidades; quando a tabela não existe, o Supabase/PostgREST devolve **404** e o hook entrava no `catch` e logava o erro.

## O que foi ajustado no código

- Em **`app/hooks/useRecurringBills.ts`**:
  - Nas duas consultas a `recurring_bill_payments`, **qualquer erro** (incluindo 404 / tabela inexistente) passa a ser tratado como **lista vazia de pagamentos**.
  - Não se faz mais `throw` nessa query; o hook não quebra a UI e não loga "Erro ao calcular total de contas fixas não pagas" no console.
- Com isso, **Dashboard**, **Contas** e **Mensalidades** continuam funcionando mesmo sem a tabela; o total de contas fixas não pagas fica 0 quando a tabela não existe.

## Resumo do fluxo

```
Login → Redirect /dashboard
  → Dashboard monta
    → SpendingForecast monta
      → useUnpaidRecurringBillsTotal() roda
        → fetch GET .../recurring_bill_payments?... (404 se tabela não existir)
Usuário clica "Contas"
  → Navega para /accounts (Dashboard desmonta)
  → Resposta 404 chega → antes: catch → console.error
                        → agora: payments = [] → sem erro
```

## Se quiser usar Mensalidades / contas fixas de verdade

- Rodar no **Supabase → SQL Editor** o script:
  **`create-recurring-bills-structure.sql`**
- Esse script cria a tabela `recurring_bill_payments`, RLS e colunas de conta fixa em `accounts`. Depois disso, a funcionalidade de contas fixas e o total não pago passam a usar o banco normalmente.
