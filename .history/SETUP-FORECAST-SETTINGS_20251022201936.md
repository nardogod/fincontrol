# Configuração das Previsões de Gastos

## 1. Executar SQL no Supabase

Execute o seguinte SQL no seu banco de dados Supabase para criar a tabela de configurações:

```sql
-- Copie e cole o conteúdo do arquivo create-forecast-settings-table.sql
-- no SQL Editor do Supabase
```

## 2. Funcionalidades Implementadas

### ✅ Configurações Personalizadas
- **Orçamento Mensal**: Defina um valor fixo ou use estimativa automática
- **Tipo de Orçamento**: 
  - **Fixo**: Usa o valor definido como meta
  - **Flexível**: Calcula automaticamente baseado no histórico
- **Alerta Personalizado**: Configure em que percentual receber alertas (ex: 80%)
- **Ajuste Automático**: Atualiza estimativas conforme novos dados
- **Notificações**: Ative/desative alertas de gastos

### ✅ Onde Configurar
1. **Dashboard**: Vá para uma conta específica
2. **Configurações da Conta**: Clique em "Configurar" na página de contas
3. **Seção "Configurações de Previsão"**: Edite as configurações conforme necessário

### ✅ Como Funciona

#### Orçamento Fixo
- Define um valor mensal específico (ex: 6000 kr)
- Sistema usa este valor como meta
- Alertas baseados no percentual configurado

#### Orçamento Flexível
- Calcula automaticamente baseado nos últimos 6 meses
- Ajusta conforme novos dados históricos
- Mais preciso para padrões de gasto variáveis

#### Alertas Inteligentes
- Configurável por percentual (ex: 80% = alerta aos 4800 kr de 6000 kr)
- Status visual: Verde (no prazo), Amarelo (alerta), Vermelho (acima)
- Notificações opcionais

### ✅ Exemplo de Uso

1. **Conta "Mercado"**:
   - Orçamento: 6000 kr/mês (fixo)
   - Alerta: 80% (4800 kr)
   - Resultado: Sistema alerta quando gastar 4800 kr

2. **Conta "Transporte"**:
   - Orçamento: Flexível (baseado no histórico)
   - Alerta: 90% 
   - Resultado: Sistema calcula média histórica e alerta aos 90%

### ✅ Interface Visual

- **Cards coloridos** por status
- **Barras de progresso** animadas
- **Ícones intuitivos** (✅ ⚠️ 🔴)
- **Valores em tempo real**
- **Configurações fáceis** de editar

## 3. Próximos Passos

1. Execute o SQL no Supabase
2. Acesse as configurações de uma conta
3. Configure seu orçamento mensal
4. Ajuste os alertas conforme necessário
5. Veja as previsões atualizadas no dashboard

## 4. Troubleshooting

Se as configurações não aparecerem:
1. Verifique se executou o SQL
2. Recarregue a página
3. Verifique os logs do console para erros

Se as previsões não atualizarem:
1. Verifique se há transações históricas (últimos 6 meses)
2. Configure um orçamento manual se necessário
3. Ajuste o tipo de orçamento (fixo vs flexível)
