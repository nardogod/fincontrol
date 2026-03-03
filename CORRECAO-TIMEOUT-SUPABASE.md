# 🔧 CORREÇÃO: Timeout e Logs do Supabase

## ✅ Mudanças Implementadas

### 1. **Verificação Prévia do Supabase**

**Arquivo:** `app/lib/telegram/commands.ts` (linhas 69-75)

**Antes:** Tentava executar query mesmo se Supabase não estivesse configurado.

**Depois:** Verifica se Supabase está configurado ANTES de tentar query:

```typescript
// Verificar se Supabase está configurado ANTES de tentar query
if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://placeholder.supabase.co") {
  console.error(`❌ [COMMANDS] Supabase não configurado corretamente!`);
  link = null;
} else {
  // Executar query...
}
```

**Benefício:** Evita tentar query com configuração inválida.

### 2. **Timeout Reduzido**

**Antes:** Timeout de 8 segundos (muito lento).

**Depois:** Timeout de 3 segundos (mais rápido):

```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`Query Supabase timeout após ${elapsed}ms`));
  }, 3000); // 3 segundos
});
```

**Benefício:** Resposta mais rápida quando Supabase está offline.

### 3. **Logs Detalhados**

Adicionados logs em pontos críticos:

- ✅ Log antes de executar query
- ✅ Log do tempo de execução da query
- ✅ Log do resultado (sucesso/erro)
- ✅ Log do tempo decorrido em caso de erro

**Exemplo de logs esperados:**

```
🔍 [COMMANDS] Executando query Supabase...
🔍 [COMMANDS] Telegram ID: 123456789
🔍 [COMMANDS] Supabase URL configurado: https://...
🔍 [COMMANDS] Aguardando resultado da query (timeout: 3s)...
🔍 [COMMANDS] Query completada em 250ms
🔍 [COMMANDS] Query resultado: Sucesso
🔍 [COMMANDS] Link encontrado: Sim
```

### 4. **Tratamento de Erro Melhorado**

**Antes:** Erro genérico sem detalhes.

**Depois:** Logs detalhados com mensagem e stack trace:

```typescript
catch (error) {
  queryError = error instanceof Error ? error : new Error(String(error));
  console.error(`❌ [COMMANDS] Erro na query Supabase:`, queryError);
  console.error(`❌ [COMMANDS] Mensagem: ${queryError.message}`);
  console.error(`❌ [COMMANDS] Stack:`, queryError.stack || "N/A");
  link = null; // Continuar sem link
}
```

## 📊 Fluxo Corrigido

```
1. Telegram → Vercel (webhook)
2. route.ts processa ANTES de retornar ✅
3. handleStartCommand inicia
4. Verifica se Supabase está configurado ✅
5. Se configurado:
   - Executa query com timeout de 3s
   - Se timeout: continua sem link
   - Se sucesso: usa link
6. Se não configurado: continua sem link
7. Envia mensagem (com ou sem link) ✅
8. Retorna { ok: true } ao Telegram ✅
```

## 🎯 Resultado Esperado

### **Cenário 1: Supabase Online**
```
✅ Query completa em < 1s
✅ Usuário vinculado encontrado
✅ Mensagem de boas-vindas enviada
```

### **Cenário 2: Supabase Offline**
```
⚠️ Query timeout após 3s
⚠️ Continua sem link
✅ Mensagem de autenticação enviada
```

### **Cenário 3: Supabase Não Configurado**
```
❌ Detecta configuração inválida
✅ Pula query completamente
✅ Mensagem de autenticação enviada
```

## 🔍 Próximos Passos

1. ✅ Deploy para produção
2. ✅ Testar com `/start` no Telegram
3. ✅ Verificar logs do Vercel
4. ✅ Confirmar que bot responde mesmo com Supabase offline

## 📝 Logs para Monitorar

Após deploy, verificar nos logs do Vercel:

- `🔍 [COMMANDS] Executando query Supabase...` - Query iniciada
- `🔍 [COMMANDS] Query completada em Xms` - Query concluída
- `❌ [COMMANDS] Erro na query Supabase` - Query falhou
- `📤 [COMMANDS] Enviando mensagem...` - Mensagem sendo enviada
- `✅ [COMMANDS] Mensagem enviada` - Mensagem enviada com sucesso

## ⚠️ Observações

- **Timeout de 3s:** Pode ser ajustado se necessário (2-5s é ideal)
- **Fallback:** Bot sempre responde, mesmo se Supabase falhar
- **Performance:** Query rápida (< 1s) quando Supabase está online

