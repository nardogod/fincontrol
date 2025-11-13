# 🚀 Proposta de Melhorias: Bot Telegram com Linguagem Natural

## 📋 Objetivo

Permitir que o usuário escreva transações **"de qualquer jeito"** e o bot entenda automaticamente:
- Tipo (receita/despesa)
- Valor
- Categoria
- Conta
- Descrição

---

## 🎯 Funcionalidades Propostas

### 1. **Processamento de Linguagem Natural**

#### Exemplos de Entradas Aceitas:

**Despesas:**
- `"gastei 50 reais no mercado"`
- `"comprei café por 10"`
- `"paguei conta de luz 150"`
- `"50 mercado"`
- `"gasto 100 alimentação"`
- `"saída 200 transporte"`

**Receitas:**
- `"recebi 5000 de salário"`
- `"entrada 1000 freelance"`
- `"5000 salário"`
- `"receita 2000"`

**Com Conta Específica:**
- `"50 mercado conta corrente"`
- `"gastei 100 no cartão de crédito"`
- `"recebi 5000 salário poupança"`

---

## 🔧 Implementação Proposta

### **Fase 1: Parser Inteligente** (Essencial)

#### 1.1 Extração de Valor
```typescript
// Padrões aceitos:
- "50", "50.00", "50,00"
- "R$ 50", "50 reais", "50 BRL"
- "cinquenta reais" (futuro: texto para número)
```

#### 1.2 Identificação de Tipo
```typescript
// Palavras-chave para DESPESA:
- gasto, gastei, paguei, comprei, saída, saída, despesa
- mercado, supermercado, restaurante, transporte, etc.

// Palavras-chave para RECEITA:
- recebi, entrada, ganhei, salário, freelance, investimento
```

#### 1.3 Identificação de Categoria
```typescript
// Mapeamento inteligente:
- "mercado", "supermercado", "compras" → Alimentação
- "restaurante", "bar", "lanche" → Alimentação
- "uber", "taxi", "gasolina", "transporte" → Transporte
- "luz", "água", "internet", "conta" → Utilidades
- "salário", "salario" → Salário
- "freelance", "freela" → Trabalho Extra
```

#### 1.4 Identificação de Conta
```typescript
// Buscar por nome nas contas do usuário:
- "conta corrente", "corrente" → Conta Corrente
- "poupança", "poupanca" → Poupança
- "cartão", "cartao", "crédito" → Cartão de Crédito
- Se não encontrar, usar conta padrão ou perguntar
```

---

### **Fase 2: Fluxo Inteligente** (Recomendado)

#### 2.1 Processamento Automático
```
Usuário: "gastei 50 no mercado"
Bot: 
  1. Identifica: DESPESA
  2. Extrai: R$ 50,00
  3. Categoria: Alimentação (por "mercado")
  4. Conta: Usa padrão ou pergunta se múltiplas contas
  5. Cria transação automaticamente
  6. Confirma: "✅ Despesa de R$ 50,00 registrada em Alimentação"
```

#### 2.2 Confirmação Inteligente
```
Se tudo estiver claro:
  ✅ Cria automaticamente e confirma

Se faltar informação:
  ❓ Pergunta apenas o que falta:
  - "Qual conta?" (se múltiplas)
  - "Qual categoria?" (se não identificar)
  - "É receita ou despesa?" (se ambíguo)
```

#### 2.3 Aprendizado de Padrões
```
Usuário sempre usa "mercado" → Aprende que é Alimentação
Usuário sempre usa mesma conta → Usa como padrão
```

---

### **Fase 3: Melhorias Avançadas** (Opcional)

#### 3.1 Contexto de Conversa
```
Usuário: "gastei 50"
Bot: "Qual categoria?"
Usuário: "mercado"
Bot: "Qual conta?"
Usuário: "corrente"
Bot: ✅ Cria transação
```

#### 3.2 Múltiplas Transações
```
Usuário: "gastei 50 mercado e 30 transporte"
Bot: Cria 2 transações automaticamente
```

#### 3.3 Edição Rápida
```
Usuário: "corrige a última para 100"
Bot: Edita última transação
```

---

## 📊 Comparação: Antes vs Depois

### **ANTES (Atual)**
```
Usuário: /gasto 50
Bot: "Selecione categoria" [botões]
Usuário: [clica em botão]
Bot: "Selecione conta" [botões]
Usuário: [clica em botão]
Bot: ✅ Criado
```
**Passos:** 3 interações

### **DEPOIS (Proposto)**
```
Usuário: "gastei 50 no mercado"
Bot: ✅ "Despesa de R$ 50,00 registrada em Alimentação"
```
**Passos:** 1 interação (automático!)

---

## 🛠️ Arquitetura Técnica

### **Novo Módulo: `natural-language-parser.ts`**

```typescript
interface ParsedTransaction {
  type: "expense" | "income" | null;
  amount: number | null;
  category: string | null;
  account: string | null;
  description: string;
  confidence: number; // 0-1, confiança no parsing
}

function parseNaturalLanguage(
  text: string,
  userAccounts: Account[],
  userCategories: Category[]
): ParsedTransaction
```

### **Integração no Webhook**

```typescript
// Se não for comando (/start, /help, etc)
if (!text.startsWith("/")) {
  const parsed = parseNaturalLanguage(text, accounts, categories);
  
  if (parsed.confidence > 0.7) {
    // Alta confiança → Criar automaticamente
    await createTransactionAutomatically(parsed);
  } else if (parsed.confidence > 0.4) {
    // Média confiança → Confirmar antes
    await askForConfirmation(parsed);
  } else {
    // Baixa confiança → Perguntar o que falta
    await askForMissingInfo(parsed);
  }
}
```

---

## 🎨 Experiência do Usuário

### **Cenário 1: Tudo Claro**
```
Você: "gastei 50 no mercado"
Bot: ✅ "Despesa de R$ 50,00 registrada em Alimentação na conta Corrente"
```

### **Cenário 2: Falta Categoria**
```
Você: "gastei 50"
Bot: ❓ "Qual categoria? (mercado, transporte, lazer...)"
Você: "mercado"
Bot: ✅ "Despesa de R$ 50,00 registrada em Alimentação"
```

### **Cenário 3: Falta Conta**
```
Você: "gastei 50 mercado"
Bot: ❓ "Qual conta?"
[Mostra botões com contas]
Você: [clica]
Bot: ✅ Criado
```

### **Cenário 4: Ambíguo**
```
Você: "50"
Bot: ❓ "É receita ou despesa?"
[Mostra botões: Receita / Despesa]
Você: [clica]
Bot: ❓ "Qual categoria?"
...
```

---

## 📈 Prioridades de Implementação

### **🔥 Prioridade ALTA (MVP)**
1. ✅ Extração de valor (números, R$, reais)
2. ✅ Identificação básica de tipo (palavras-chave)
3. ✅ Mapeamento de categorias comuns
4. ✅ Criação automática quando tudo estiver claro

### **⭐ Prioridade MÉDIA**
5. Identificação de conta por nome
6. Confirmação inteligente (só pergunta o necessário)
7. Mensagens de feedback claras

### **💎 Prioridade BAIXA (Futuro)**
8. Contexto de conversa (múltiplas mensagens)
9. Múltiplas transações em uma mensagem
10. Aprendizado de padrões do usuário
11. Texto para número ("cinquenta reais")

---

## 🧪 Exemplos de Testes

### **Teste 1: Despesa Completa**
```
Input: "gastei 50 reais no mercado"
Esperado: {
  type: "expense",
  amount: 50,
  category: "Alimentação",
  account: "padrão",
  confidence: 0.9
}
```

### **Teste 2: Receita Simples**
```
Input: "recebi 5000"
Esperado: {
  type: "income",
  amount: 5000,
  category: null, // perguntar
  account: "padrão",
  confidence: 0.7
}
```

### **Teste 3: Com Conta**
```
Input: "50 mercado conta corrente"
Esperado: {
  type: "expense",
  amount: 50,
  category: "Alimentação",
  account: "Conta Corrente",
  confidence: 0.95
}
```

---

## 💡 Vantagens

1. **Velocidade:** 1 mensagem vs 3-4 interações
2. **Naturalidade:** Escreve como fala
3. **Flexibilidade:** Aceita vários formatos
4. **Inteligência:** Entende contexto
5. **Fallback:** Se não entender, pergunta o necessário

---

## 🤔 Decisões a Tomar

1. **Conta Padrão:** Usar sempre a primeira conta ou perguntar sempre?
2. **Confiança Mínima:** Qual nível de confiança para criar automaticamente?
3. **Fallback:** Se não identificar categoria, usar "Outros" ou perguntar?
4. **Múltiplas Contas:** Como lidar quando usuário tem várias contas?

---

## 📝 Próximos Passos

1. ✅ **Aprovar proposta**
2. 🔨 **Implementar parser básico**
3. 🧪 **Testar com casos reais**
4. 🚀 **Deploy e feedback**
5. 🔄 **Iterar e melhorar**

---

**O que você acha? Vamos começar pela Fase 1 (Parser Inteligente)?**

