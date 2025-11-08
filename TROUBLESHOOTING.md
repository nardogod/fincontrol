# 🔧 Troubleshooting - FinControl

Este documento contém soluções para problemas comuns encontrados durante o desenvolvimento e deploy do projeto.

## 📋 Índice

1. [Script de Deploy Travando](#script-de-deploy-travando)
2. [Erro: user_id null em Transações](#erro-user_id-null-em-transações)
3. [Build Falhando no Netlify](#build-falhando-no-netlify)
4. [Página 404 no Deploy](#página-404-no-deploy)
5. [Problemas de Permissão no Windows](#problemas-de-permissão-no-windows)

---

## 🚨 Script de Deploy Travando

### Problema

O script `deploy-manual.js` trava na etapa "🛑 Parando processos Node.js..." e não continua o deploy.

**Sintomas:**

```
🚀 Iniciando deploy manual via Netlify CLI...
⚠️  REGRA DO PROJETO: Deploy sempre manual via terminal do Cursor

🔍 Verificando Netlify CLI...
✅ Netlify CLI encontrado

🛑 Parando processos Node.js...
[Script trava aqui e não continua]
```

### Causa

- Comandos `execSync` com `taskkill` ou PowerShell podem travar indefinidamente em alguns ambientes Windows
- Timeouts não funcionam corretamente em alguns casos
- A verificação de processos não é crítica para o deploy funcionar

### Solução

**Opção 1: Remover verificação de processos (RECOMENDADO)**

Edite `deploy-manual.js` e remova ou comente a seção de verificação de processos:

```javascript
// ❌ REMOVIDO - Causava travamento
// 2. Parar processos Node.js que possam estar usando .next
// console.log("🛑 Parando processos Node.js...");
// ... código removido ...

// ✅ SUBSTITUIR POR:
// 2. Pular verificação de processos (pode causar travamento)
// O build do Next.js vai falhar se houver arquivos bloqueados, mas isso é raro
console.log(
  "⏭️  Pulando verificação de processos (continuando direto para limpeza)\n"
);
```

**Opção 2: Fechar processos manualmente**

Se o build falhar com erro de arquivo bloqueado:

1. Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc)
2. Encontre processos `node.exe`
3. Finalize todos os processos Node.js
4. Execute `npm run deploy` novamente

### Prevenção

- Sempre feche processos Node.js manualmente antes do deploy se necessário
- O build do Next.js vai falhar claramente se houver arquivos bloqueados
- Não adicione verificações de processos que possam travar o script

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido  
**Arquivo:** `deploy-manual.js` (linhas 23-25)

---

## 🚨 Erro: user_id null em Transações

### Problema

Erro ao criar transações no sistema live:

```
POST https://ncysankyxvwsuwbqmmtj.supabase.co/rest/v1/transactions 400 (Bad Request)
Error: null value in column "user_id" of relation "transactions" violates not-null constraint
```

### Causa

O `user_id` não está sendo fornecido durante a criação de transações. Isso pode acontecer quando:

- O usuário não está autenticado corretamente
- A verificação de autenticação falha silenciosamente
- O `user_id` não é extraído corretamente do contexto de autenticação

### Solução

Adicionar verificação explícita de usuário autenticado antes de criar transações:

```typescript
// ✅ CORRETO - Verificar usuário antes de criar transação
const {
  data: { user: currentUser },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !currentUser) {
  throw new Error("Usuário não autenticado. Faça login novamente.");
}

// Criar transação com user_id garantido
const { error } = await supabase.from("transactions").insert({
  ...validated,
  created_via: "web",
  user_id: currentUser.id, // ✅ Sempre fornecido
});
```

### Arquivos Corrigidos

- ✅ `app/components/TransactionForm.tsx`
- ✅ `app/components/SimpleChatModal.tsx`
- ✅ `app/components/FloatingChat.tsx`
- ✅ `app/components/WhatsAppChat.tsx`
- ✅ `app/hooks/useAccountTransfer.ts`
- ✅ `app/lib/account-transfer.ts`
- ✅ `app/components/BankTransferModal.tsx`

### Prevenção

- Sempre verificar `currentUser` e `userError` antes de criar transações
- Nunca assumir que o usuário está autenticado
- Sempre fornecer `user_id: currentUser.id` explicitamente

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido

---

## 🚨 Build Falhando no Netlify

### Problema

O build falha no Netlify com erros como:

- `PageNotFoundError: Cannot find module for page: /_document`
- `Module not found: Can't resolve '@/app/components/...'`
- `Invalid next.config.js options detected`

### Causa

- Netlify não está processando corretamente o Next.js App Router
- O plugin `@netlify/plugin-nextjs` não está sendo executado
- Build local vs build no Netlify usando versões diferentes do Next.js

### Solução

**1. Verificar `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**2. Usar `netlify deploy --prod` (sem `--no-build`):**

O Netlify precisa processar o build com o plugin Next.js. Não use `--no-build`:

```javascript
// ✅ CORRETO
const deployOutput = execSync("netlify deploy --prod", {
  stdio: "pipe",
  encoding: "utf-8",
});

// ❌ ERRADO - Não permite que o plugin processe
execSync("netlify deploy --prod --no-build", ...);
```

**3. Verificar versão do Next.js:**

Certifique-se de que a versão local e no Netlify são compatíveis:

```bash
# Verificar versão local
npm list next

# Verificar versão no package.json
cat package.json | grep next
```

### Prevenção

- Sempre usar `netlify deploy --prod` sem `--no-build`
- Manter `netlify.toml` configurado corretamente
- Testar build local antes de fazer deploy

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido  
**Arquivo:** `deploy-manual.js` (linha 131)

---

## 🚨 Página 404 no Deploy

### Problema

Após o deploy, algumas rotas retornam 404 (Page not found).

### Causa

- Netlify não está processando corretamente o Next.js App Router
- O plugin `@netlify/plugin-nextjs` não está sendo executado
- Build foi feito com `--no-build`, impedindo o processamento do plugin

### Solução

**1. Verificar se o plugin está sendo executado:**

No log do deploy, procure por:

```
Using Next.js Runtime - v5.14.5
```

Se não aparecer, o plugin não está sendo executado.

**2. Fazer deploy sem `--no-build`:**

```bash
# ✅ CORRETO
netlify deploy --prod

# ❌ ERRADO
netlify deploy --prod --no-build
```

**3. Verificar `netlify.toml`:**

Certifique-se de que o plugin está configurado:

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Prevenção

- Sempre usar `netlify deploy --prod` sem `--no-build`
- Verificar logs do deploy para confirmar que o plugin foi executado
- Testar todas as rotas após o deploy

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido

---

## 🚨 Problemas de Permissão no Windows

### Problema

Erros de permissão durante o build ou limpeza:

```
EPERM: operation not permitted, open 'C:\LMM-proj\fincontrol\.next\trace'
unlink 'C:\LMM-proj\fincontrol\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node'
```

### Causa

- Arquivos estão sendo usados por processos Node.js
- Permissões insuficientes para remover arquivos
- Arquivos bloqueados por outros processos

### Solução

**1. Fechar processos Node.js manualmente:**

- Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc)
- Encontre processos `node.exe`
- Finalize todos os processos Node.js

**2. Usar PowerShell para limpeza:**

```powershell
# Remover .next com tratamento de erros
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Remover node_modules (se necessário)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

**3. Adicionar tratamento de erros no script:**

```javascript
// Tentar remover arquivo específico primeiro
const traceFile = path.join(".next", "trace");
if (fs.existsSync(traceFile)) {
  try {
    fs.unlinkSync(traceFile);
  } catch (e) {
    // Ignorar se não conseguir remover
  }
}

// Tentar remover diretório
try {
  execSync(
    'powershell -Command "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"',
    {
      stdio: "pipe",
    }
  );
} catch (error) {
  // Continuar mesmo se falhar
  console.log("⚠️  Não foi possível limpar .next completamente");
}
```

### Prevenção

- Sempre fechar processos Node.js antes de fazer deploy
- Usar `-ErrorAction SilentlyContinue` em comandos PowerShell
- Adicionar tratamento de erros robusto no script

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido  
**Arquivo:** `deploy-manual.js` (linhas 46-85)

---

## 📝 Notas Adicionais

### Como Adicionar Novos Problemas

1. Adicione uma nova seção com título `## 🚨 Nome do Problema`
2. Inclua:
   - **Problema**: Descrição clara
   - **Causa**: O que causa o problema
   - **Solução**: Passos para resolver
   - **Prevenção**: Como evitar no futuro
   - **Data do problema**: Data em que ocorreu
   - **Status**: ✅ Resolvido / ⚠️ Em andamento / ❌ Não resolvido

### Links Úteis

- **Netlify Dashboard**: https://app.netlify.com/sites/fincontrol-app
- **Documentação de Deploy**: `DEPLOY.md`
- **Logs do Deploy**: Verificar no Netlify Dashboard

---

## 🚨 Build Travando Durante Deploy

### Problema

O build do Next.js está rodando mas não completa durante o deploy. O processo fica travado sem finalizar.

**Sintomas:**

```
🔨 Fazendo build de produção...
  ▲ Next.js 14.2.33
  - Environments: .env.local

[Build trava aqui e não continua]
```

### Causa

- Muitos processos Node.js rodando simultaneamente (14+ processos)
- Build travando em alguma etapa específica
- Problemas de memória ou recursos do sistema
- Arquivos bloqueados por outros processos

### Solução

**1. Fechar processos Node.js automaticamente (IMPLEMENTADO):**

O script `deploy-manual.js` agora tenta fechar processos Node.js automaticamente antes do build, com timeout curto para não travar:

```javascript
// Tentar fechar processos Node.js de forma segura (com timeout curto)
console.log(
  "🛑 Tentando fechar processos Node.js que possam estar bloqueando arquivos..."
);
try {
  if (process.platform === "win32") {
    // Usar timeout muito curto (2 segundos) para não travar
    execSync(
      'powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"',
      {
        stdio: "pipe",
        timeout: 2000, // 2 segundos máximo
      }
    );
  } else {
    execSync("pkill -f node 2>/dev/null || true", {
      stdio: "pipe",
      timeout: 2000, // 2 segundos máximo
    });
  }
} catch (error) {
  // Ignorar erros - não é crítico
  console.log(
    "⚠️  Não foi possível fechar processos Node.js (continuando mesmo assim)"
  );
}

// Aguardar um pouco para processos terminarem
console.log("⏳ Aguardando 2 segundos para processos terminarem...");
execSync('powershell -Command "Start-Sleep -Seconds 2"', {
  stdio: "pipe",
  timeout: 3000,
});
```

**2. Adicionar timeout no build:**

O script `deploy-manual.js` foi atualizado com timeout de 5 minutos:

```javascript
execSync(`"${nextPath}" build`, {
  stdio: "inherit",
  cwd: process.cwd(),
  timeout: 300000, // 5 minutos de timeout
});
```

**3. Fechar processos Node.js manualmente (se necessário):**

Se o build continuar travando após a tentativa automática:

1. Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc)
2. Encontre todos os processos `node.exe`
3. Finalize todos os processos Node.js
4. Execute `npm run deploy` novamente

**4. Verificar logs do build:**

Se o build travar, verifique:

- Logs do terminal para identificar onde está travando
- Uso de memória do sistema
- Processos Node.js concorrentes

### Prevenção

- O script agora tenta fechar processos Node.js automaticamente antes do build
- Sempre fechar processos Node.js manualmente se o problema persistir
- Monitorar uso de recursos durante o build
- Considerar fazer deploy direto no Netlify (sem build local) se o problema persistir

**Data do problema:** 2025-01-07  
**Status:** ✅ Resolvido (com fechamento automático de processos)  
**Arquivo:** `deploy-manual.js` (linhas 24-57)

---

_Última atualização: 2025-01-07_
