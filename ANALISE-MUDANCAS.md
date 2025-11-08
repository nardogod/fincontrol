# 📋 Análise e Planejamento de Mudanças - Dashboard

**Data:** 2025-01-07  
**Status:** 🔍 Análise Completa - Aguardando Aprovação

---

## 📝 Resumo dos Requisitos

### 1. **Bug: Valor da Transação Mudando ao Editar**

- **Problema:** Ao editar valor (ex: 99), sistema muda para 98,8
- **Causa Provável:** Problema de arredondamento/formatação no input
- **Arquivo:** `app/components/EditTransactionModal.tsx` (linha 209-221)

### 2. **Gasto Estimado/Mês e Projeção Mensal**

- **Requisito:** Baseado nos últimos 6 meses E na meta definida pelo usuário
- **Arquivo:** `app/components/SpendingForecast.tsx` (linhas 107-130)
- **Status Atual:** Usa `customSettings.monthly_budget` se disponível, senão média histórica

### 3. **Restante Este Mês**

- **Requisito:** Relacionado à mesma lógica da meta definida pelo usuário
- **Arquivo:** `app/components/SpendingForecast.tsx` (linha 157)

### 4. **Gasto Esta Semana**

- **Status:** ✅ Está correto, não precisa de estimativa
- **Arquivo:** `app/components/SpendingForecast.tsx` (linhas 133-146)

### 5. **Meta Mensal Não Editável**

- **Problema:** Meta mensal não está sendo editável
- **Arquivo:** `app/components/AccountForecastSettings.tsx` (linhas 258-277)
- **Status Atual:** Já tem campo de edição, mas pode não estar visível/acessível

### 6. **Remover "Resumo por Conta" do Dashboard**

- **Arquivo:** `app/components/TotalBalanceCard.tsx` (linhas 218-260)
- **Ação:** Remover seção completa

### 7. **Remover "Categorias por lista" do Dashboard**

- **Arquivo:** `app/components/Dashboard.tsx` (linha 25 - import)
- **Ação:** Verificar onde está sendo usado e remover

### 8. **Remover "Top Categorias" do Dashboard**

- **Arquivo:** `app/components/FinancialSummary.tsx` (linhas 402-436)
- **Ação:** Remover Card completo

### 9. **Remover "Conta Principal: Conta Principal"**

- **Arquivo:** `app/components/AccountInterdependency.tsx` (linhas 100-105)
- **Ação:** Remover exibição do nome da conta principal

### 10. **Remover "Contas Derivadas"**

- **Arquivo:** `app/components/AccountInterdependency.tsx` (linhas 134-167)
- **Ação:** Remover Card completo

### 11. **Remover "Criar Nova Derivação"**

- **Arquivo:** `app/components/AccountInterdependency.tsx` (linhas 169-237)
- **Ação:** Remover Card completo

### 12. **Mover "Transferência entre Contas" para Página de Contas**

- **Arquivo Atual:** `app/components/Dashboard.tsx` (linhas 383-392)
- **Arquivo Destino:** `app/accounts/page.tsx`
- **Componente:** `app/components/AccountTransfer.tsx`

### 13. **Mover "Previsão de Gastos" para Abaixo do Resumo Financeiro**

- **Arquivo:** `app/components/Dashboard.tsx` (linhas 365-402)
- **Ação:** Mover `SpendingForecast` para logo após `FinancialSummary`

### 14. **Mover "Saldo Consolidado" para Página de Contas**

- **Arquivo Atual:** `app/components/AccountTransfer.tsx` (linhas 117-145)
- **Arquivo Destino:** `app/accounts/page.tsx`
- **Status:** Já existe em `app/accounts/page.tsx` (linhas 333-385), mas também está em `AccountTransfer.tsx`

---

## 🔍 Análise Detalhada por Arquivo

### **1. EditTransactionModal.tsx**

**Problema Identificado:**

```typescript
// Linha 209-221
<Input
  id="amount"
  type="number"
  step="0.01"
  placeholder="0.00"
  value={formData.amount}
  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
/>
```

**Causa Provável:**

- O `step="0.01"` pode estar causando arredondamento
- O `parseFloat` na validação pode estar arredondando
- Problema de formatação ao converter `transaction.amount.toString()`

**Solução:**

- Usar `type="text"` com validação numérica manual
- Ou garantir que o valor seja preservado exatamente como digitado
- Verificar conversão `transaction.amount.toString()` na linha 87

---

### **2. SpendingForecast.tsx**

**Status Atual:**

- ✅ Já usa `customSettings.monthly_budget` se disponível (linha 114)
- ✅ Calcula média dos últimos 6 meses (linhas 90-108)
- ✅ Calcula `remainingThisMonth` baseado na meta (linha 157)
- ✅ Calcula `projectedMonthlyTotal` baseado no ritmo atual (linha 154)

**Ajustes Necessários:**

1. **Gasto Estimado/Mês:** Garantir que sempre use a meta do usuário (não média histórica como fallback)
2. **Projeção Mensal:** Garantir que use a meta do usuário para cálculo
3. **Restante Este Mês:** Já está correto, mas verificar se usa a meta

**Código Atual:**

```typescript
// Linhas 110-130
if (customSettings && customSettings.monthly_budget) {
  monthlyEstimate = customSettings.monthly_budget;
  isUsingCustomBudget = true;
} else {
  // Fallback para média histórica
  monthlyEstimate = averageMonthlySpending || 0;
}
```

**Mudança Necessária:**

- Se não houver meta definida, não mostrar estimativa (ou mostrar 0)
- Sempre priorizar meta do usuário sobre média histórica

---

### **3. AccountForecastSettings.tsx**

**Status Atual:**

- ✅ Já tem campo de edição (linhas 258-277)
- ⚠️ Pode não estar visível/acessível no dashboard

**Verificar:**

- Onde o componente é renderizado
- Se está sendo chamado corretamente
- Se há algum modal ou diálogo que precisa ser aberto

---

### **4. TotalBalanceCard.tsx**

**Remover:**

- Linhas 218-260: Seção "Resumo por Conta"

**Código a Remover:**

```typescript
{
  /* Resumo por Conta */
}
<div className="mt-6 pt-4 border-t">
  <h4 className="text-sm font-medium text-gray-700 mb-3">Resumo por Conta:</h4>
  // ... resto do código
</div>;
```

---

### **5. Dashboard.tsx**

**Remover:**

- Linha 25: `import CategoryList from "@/app/components/CategoryList";`
- Verificar se `CategoryList` está sendo usado em algum lugar

**Mover:**

- Linhas 383-392: `AccountTransfer` → Mover para `app/accounts/page.tsx`
- Linhas 394-402: `SpendingForecast` → Mover para logo após `FinancialSummary` (linha 375)

**Nova Ordem no Dashboard:**

1. DashboardFilters
2. FinancialSummary
3. **SpendingForecast** (MOVED HERE)
4. AccountInterdependency (será removido parcialmente)
5. MonthlyChart
6. PieCharts

---

### **6. FinancialSummary.tsx**

**Remover:**

- Linhas 402-436: Card "Top Categorias"

**Código a Remover:**

```typescript
{
  /* Top Categorias */
}
<Card>
  <CardHeader>
    <CardTitle>Top Categorias</CardTitle>
  </CardHeader>
  <CardContent>// ... resto do código</CardContent>
</Card>;
```

---

### **7. AccountInterdependency.tsx**

**Remover:**

- Linhas 100-105: Exibição "Conta Principal: {nome}"
- Linhas 134-167: Card "Contas Derivadas"
- Linhas 169-237: Card "Criar Nova Derivação"

**Decisão:**

- Remover componente inteiro do Dashboard?
- Ou manter apenas a lógica de cálculo (se necessário)?

**Arquivo:** `app/components/Dashboard.tsx` (linhas 377-381)

---

### **8. AccountTransfer.tsx**

**Mover para:** `app/accounts/page.tsx`

**Componente Completo:**

- `app/components/AccountTransfer.tsx` (linhas 1-375)
- Inclui "Saldo Consolidado" (linhas 117-145)

**Ação:**

1. Remover de `Dashboard.tsx` (linhas 383-392)
2. Adicionar em `app/accounts/page.tsx`
3. Verificar se "Saldo Consolidado" já existe em `accounts/page.tsx` e consolidar

---

### **9. accounts/page.tsx**

**Adicionar:**

- `AccountTransfer` component
- Verificar se "Saldo Consolidado" já existe e consolidar

**Status Atual:**

- Já tem "Saldo Total Consolidado" (linhas 333-385)
- Pode precisar consolidar com o de `AccountTransfer.tsx`

---

## 📊 Plano de Implementação

### **Fase 1: Correções de Bugs**

1. ✅ Corrigir bug de arredondamento no `EditTransactionModal.tsx`
2. ✅ Ajustar lógica de `SpendingForecast.tsx` para sempre usar meta do usuário
3. ✅ Verificar e corrigir editabilidade da meta mensal

### **Fase 2: Remoções do Dashboard**

1. ✅ Remover "Resumo por Conta" de `TotalBalanceCard.tsx`
2. ✅ Remover "Categorias por lista" (verificar uso de `CategoryList`)
3. ✅ Remover "Top Categorias" de `FinancialSummary.tsx`
4. ✅ Remover "Conta Principal" de `AccountInterdependency.tsx`
5. ✅ Remover "Contas Derivadas" de `AccountInterdependency.tsx`
6. ✅ Remover "Criar Nova Derivação" de `AccountInterdependency.tsx`

### **Fase 3: Reorganização**

1. ✅ Mover `SpendingForecast` para logo após `FinancialSummary` no Dashboard
2. ✅ Mover `AccountTransfer` para `app/accounts/page.tsx`
3. ✅ Consolidar "Saldo Consolidado" em `app/accounts/page.tsx`

### **Fase 4: Limpeza**

1. ✅ Remover imports não utilizados
2. ✅ Verificar se `AccountInterdependency` ainda é necessário
3. ✅ Verificar se `CategoryList` ainda é necessário

---

## ⚠️ Pontos de Atenção

1. **Dependências:**

   - Verificar se outros componentes dependem dos que serão removidos
   - Verificar se há referências a `CategoryList` em outros lugares
   - Verificar se `AccountInterdependency` é usado em outros lugares

2. **Dados:**

   - Verificar se a remoção de "Contas Derivadas" afeta alguma lógica de negócio
   - Verificar se a remoção de "Criar Nova Derivação" afeta funcionalidades

3. **UI/UX:**

   - Garantir que a nova ordem no Dashboard faça sentido
   - Garantir que a página de Contas tenha espaço para os novos componentes

4. **Testes:**
   - Testar edição de transação com valores exatos
   - Testar cálculo de gastos estimados com meta definida
   - Testar cálculo de projeção mensal
   - Testar remoção de componentes sem quebrar o layout

---

## 📝 Checklist de Implementação

### **Correções**

- [ ] Corrigir bug de arredondamento em `EditTransactionModal.tsx`
- [ ] Ajustar `SpendingForecast.tsx` para sempre usar meta do usuário
- [ ] Verificar editabilidade da meta mensal

### **Remoções**

- [ ] Remover "Resumo por Conta" de `TotalBalanceCard.tsx`
- [ ] Remover "Categorias por lista" do Dashboard
- [ ] Remover "Top Categorias" de `FinancialSummary.tsx`
- [ ] Remover "Conta Principal" de `AccountInterdependency.tsx`
- [ ] Remover "Contas Derivadas" de `AccountInterdependency.tsx`
- [ ] Remover "Criar Nova Derivação" de `AccountInterdependency.tsx`

### **Reorganização**

- [ ] Mover `SpendingForecast` para logo após `FinancialSummary`
- [ ] Mover `AccountTransfer` para `app/accounts/page.tsx`
- [ ] Consolidar "Saldo Consolidado" em `app/accounts/page.tsx`

### **Limpeza**

- [ ] Remover imports não utilizados
- [ ] Verificar dependências
- [ ] Testar todas as funcionalidades

---

## 🎯 Próximos Passos

1. **Aguardar aprovação** desta análise
2. **Implementar mudanças** seguindo o plano acima
3. **Testar** todas as funcionalidades
4. **Fazer commit** das mudanças
5. **Deploy** manual via terminal

---

_Análise completa. Aguardando aprovação para implementação._
