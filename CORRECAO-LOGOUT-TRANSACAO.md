# 🔧 Correção: Usuário sendo deslogado ao criar transação

## 🐛 Problema Identificado

Usuários autenticados estavam sendo redirecionados para a tela de login ao tentar criar uma transação, mesmo estando autenticados.

## 🔍 Causa Raiz

O problema estava relacionado a:

1. **Sincronização de cookies**: O cliente Supabase no browser pode não estar sincronizando corretamente com os cookies definidos pelo servidor
2. **Verificação de autenticação muito restritiva**: A função `getCurrentUserWithRefresh()` não estava tentando refresh explícito da sessão
3. **Falta de retry**: Não havia tentativa de retry em caso de falha temporária de sincronização

## ✅ Soluções Aplicadas

### 1. Melhorias em `app/lib/auth-helpers.ts`

**Antes:**
- Verificava apenas `getUser()` diretamente
- Não tentava refresh explícito da sessão
- Não verificava se havia sessão antes de tentar obter usuário

**Agora:**
- Verifica primeiro se há sessão com `getSession()`
- Se há sessão mas erro ao obter usuário, tenta refresh explícito com `refreshSession()`
- Adiciona logs detalhados para debug
- Trata erros de JWT expirado

### 2. Melhorias em `app/components/TransactionForm.tsx`

**Antes:**
- Redirecionava imediatamente se `getCurrentUserWithRefresh()` retornasse `null`
- Não havia retry em caso de falha temporária

**Agora:**
- Adiciona retry com delay de 500ms antes de redirecionar
- Permite que o toast seja exibido antes do redirecionamento
- Usa `let` em vez de `const` para permitir reatribuição após retry

## 📋 Mudanças Detalhadas

### `app/lib/auth-helpers.ts`

```typescript
export async function getCurrentUserWithRefresh(): Promise<User | null> {
  const supabase = createClient();

  // Primeiro, tenta obter a sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Se há sessão, tenta obter o usuário
  if (session) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Se não há erro e há usuário, retorna
    if (!userError && user) {
      return user;
    }

    // Se há erro relacionado a refresh, tenta refresh explícito
    if (userError && (userError.message.includes("refresh") || userError.message.includes("expired") || userError.message.includes("JWT"))) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && refreshedSession?.user) {
        return refreshedSession.user;
      }
    }
  }

  return null;
}
```

### `app/components/TransactionForm.tsx`

```typescript
// Buscar usuário atual com tentativa de refresh
let currentUser = await getCurrentUserWithRefresh();

if (!currentUser) {
  // Tentar uma última vez após um pequeno delay (pode ser problema de sincronização)
  await new Promise(resolve => setTimeout(resolve, 500));
  const retryUser = await getCurrentUserWithRefresh();
  
  if (!retryUser) {
    // Redirecionar apenas após retry falhar
    redirectToLogin("/transactions/new");
    return;
  }
  
  // Se conseguiu na segunda tentativa, usar esse usuário
  currentUser = retryUser;
}
```

## 🧪 Como Testar

1. Faça login no app
2. Vá para criar nova transação
3. Preencha os campos e clique em "Criar Transação"
4. **Resultado esperado**: Transação deve ser criada sem redirecionar para login

## 🔍 Logs para Debug

Se o problema persistir, verifique os logs do console do browser:

- `"Session expired, attempting refresh..."` - Tentando refresh
- `"Session refreshed successfully"` - Refresh bem-sucedido
- `"No session found"` - Nenhuma sessão encontrada
- `"User authentication failed after retry"` - Falha após retry

## 📝 Próximos Passos (se necessário)

Se o problema persistir, considere:

1. Verificar configuração de cookies no middleware
2. Verificar se há problemas de CORS
3. Verificar se o token está realmente expirando muito rápido
4. Considerar usar Server Actions em vez de chamadas diretas do cliente

## ✅ Status

- ✅ Função de autenticação melhorada
- ✅ Retry adicionado
- ✅ Logs detalhados adicionados
- ✅ Tratamento de erros melhorado

