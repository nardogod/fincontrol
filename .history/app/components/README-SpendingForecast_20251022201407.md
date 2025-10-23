# Sistema de Previsão de Gastos

Este sistema implementa funcionalidades de previsão de gastos em cascata para o FinControl, permitindo que os usuários vejam estimativas baseadas no histórico de transações.

## Componentes Implementados

### 1. SpendingForecast.tsx
**Componente principal de previsão de gastos para uma conta específica.**

**Props:**
- `account: TAccount` - Conta para a qual calcular a previsão
- `transactions: TTransaction[]` - Transações do período atual
- `historicalTransactions: TTransaction[]` - Transações históricas (últimos 6 meses)

**Funcionalidades:**
- Calcula gasto estimado mensal baseado na média dos últimos 6 meses
- Mostra gasto atual da semana
- Calcula valor restante do mês
- Exibe projeção mensal baseada no ritmo atual
- Status visual: on-track, over-budget, under-budget
- Barra de progresso visual
- Avisos e recomendações

### 2. QuickForecast.tsx
**Versão compacta do componente de previsão.**

**Props:**
- `account: TAccount` - Conta para análise
- `transactions: TTransaction[]` - Transações atuais
- `historicalTransactions: TTransaction[]` - Transações históricas
- `compact?: boolean` - Modo compacto (padrão: false)

**Funcionalidades:**
- Versão resumida da previsão
- Modo compacto para uso em cards pequenos
- Informações essenciais: status, gastos, progresso

### 3. AccountsForecastSummary.tsx
**Resumo de previsões para todas as contas.**

**Props:**
- `accounts: TAccount[]` - Lista de todas as contas
- `transactions: TTransaction[]` - Transações do mês atual
- `historicalTransactions: TTransaction[]` - Transações históricas

**Funcionalidades:**
- Resumo geral de todas as contas
- Totais agregados
- Cards individuais para cada conta
- Status visual por conta

### 4. AccountQuickView.tsx
**Visualização rápida de uma conta com previsão opcional.**

**Props:**
- `account: TAccount` - Conta para visualização
- `transactions: TTransaction[]` - Transações atuais
- `historicalTransactions: TTransaction[]` - Transações históricas
- `showForecast?: boolean` - Mostrar previsão (padrão: true)

**Funcionalidades:**
- Resumo financeiro da conta
- Receitas e despesas do mês
- Balanço atual
- Gastos da semana
- Previsão opcional com status

## Integração no Sistema

### Dashboard Principal
O `SpendingForecast` foi integrado no dashboard principal (`app/components/Dashboard.tsx`) e é exibido apenas para a conta ativa selecionada.

### Página de Contas
O `AccountsForecastSummary` foi integrado na página de contas (`app/accounts/page.tsx`) para mostrar previsões de todas as contas.

## Lógica de Cálculo

### Estimativa Mensal
- Baseada na média dos gastos dos últimos 6 meses
- Filtra apenas transações do tipo "expense"
- Considera apenas transações da conta específica

### Status de Orçamento
- **on-track**: Gasto atual está dentro da faixa normal (70-100% da estimativa)
- **over-budget**: Gasto atual excede a estimativa mensal
- **under-budget**: Gasto atual está abaixo de 70% da estimativa

### Confiança da Estimativa
- **Alta**: 4+ meses com dados históricos
- **Média**: 2-3 meses com dados históricos  
- **Baixa**: Menos de 2 meses com dados históricos

## Exemplo de Uso

```tsx
// No dashboard para conta ativa
<SpendingForecast
  account={activeAccount}
  transactions={filteredTransactions}
  historicalTransactions={filteredHistoricalTransactions}
/>

// Resumo de todas as contas
<AccountsForecastSummary
  accounts={accounts}
  transactions={currentMonthTransactions}
  historicalTransactions={historicalTransactions}
/>

// Visualização rápida de uma conta
<AccountQuickView
  account={account}
  transactions={transactions}
  historicalTransactions={historicalTransactions}
  showForecast={true}
/>
```

## Características Visuais

- **Cores de Status:**
  - Verde: No prazo (on-track)
  - Azul: Abaixo do orçamento (under-budget)
  - Vermelho: Acima do orçamento (over-budget)

- **Barras de Progresso:**
  - Mostram percentual de uso do orçamento estimado
  - Cores dinâmicas baseadas no status
  - Animações suaves

- **Avisos:**
  - Alertas quando acima do orçamento
  - Parabéns quando abaixo do orçamento
  - Informações sobre confiança da estimativa

## Dados Necessários

Para funcionar corretamente, os componentes precisam de:
1. Transações do mês atual
2. Transações históricas dos últimos 6 meses
3. Informações da conta (id, nome, tipo, cor, ícone)

O sistema é responsivo e se adapta a diferentes tamanhos de tela.
