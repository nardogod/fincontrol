# 🔧 Correção: Bot não encontra contas do usuário

## ✅ Problema Identificado

Após vincular a conta do Telegram, o bot mostrava:
```
❌ Nenhuma conta encontrada.
```

Para todos os comandos que precisam de contas (`/contas`, `/hoje`, `/mes`, `/gasto`, `/receita`).

**Causa:**
- A função `getUserByTelegramId()` retorna `{ user_id }` (objeto com campo `user_id`)
- Mas o código estava usando `user.id` em vez de `user.user_id`
- Isso fazia com que as queries do banco não encontrassem nenhuma conta

---

## ✅ Correções Aplicadas

### 1. **Corrigido acesso ao `user_id`**
   - ✅ Todas as ocorrências de `user.id` foram alteradas para `user.user_id`
   - ✅ Corrigido em 6 lugares diferentes no código:
     - `handleExpenseCommand` - busca de contas para filtrar categorias
     - `askForCategory` - busca de contas do usuário
     - `askForAccount` - busca de contas para seleção
     - `handleAccountsCommand` - listagem de contas
     - `handleTodayCommand` - busca de contas para resumo do dia
     - `handleMonthCommand` - busca de contas para resumo do mês

### 2. **Adicionado `user_id` na inserção de transações**
   - ✅ Adicionado `user_id: user.user_id` na inserção de transações
   - ✅ Garante que as transações sejam associadas ao usuário correto

---

## 🧪 Teste Novamente

Agora você pode testar:

1. **`/contas`** - Deve listar suas contas
2. **`/gasto 50`** - Deve funcionar e mostrar suas contas
3. **`/receita 5000`** - Deve funcionar e mostrar suas contas
4. **`/hoje`** - Deve mostrar resumo do dia
5. **`/mes`** - Deve mostrar resumo do mês

---

## 📝 Detalhes Técnicos

**Antes:**
```typescript
const user = await getUserByTelegramId(telegramId);
// user = { user_id: "abc123..." }

const { data: accounts } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.id)  // ❌ ERRADO: user.id é undefined
  .eq("is_active", true);
```

**Depois:**
```typescript
const user = await getUserByTelegramId(telegramId);
// user = { user_id: "abc123..." }

const { data: accounts } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.user_id)  // ✅ CORRETO: user.user_id é "abc123..."
  .eq("is_active", true);
```

---

## ✅ Status

- ✅ Todas as referências corrigidas
- ✅ `user_id` adicionado na inserção de transações
- ✅ Bot agora deve encontrar contas corretamente

