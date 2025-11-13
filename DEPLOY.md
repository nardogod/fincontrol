# 🚀 Deploy Manual - FinControl

## ⚠️ REGRA DO PROJETO - IMPORTANTE

**🚨 O DEPLOY É SEMPRE MANUAL 🚨**

- ❌ **NÃO há deploy automático**
- ❌ **NÃO há GitHub Actions para deploy**
- ✅ **SEMPRE fazer deploy manual via terminal do Cursor**
- ✅ **Processo padrão: Scripts PowerShell nativos para Windows**
- ✅ **Comando padrão: `npm run deploy`** (usa `deploy-only.ps1`)

## Status do Deploy

- ✅ **Deploy manual configurado**
- ✅ **Netlify CLI integrado**
- ✅ **Script de deploy disponível**
- ⚠️ **Deploy automático DESABILITADO**

## 🔧 Como Funciona

### 1. **Deploy Manual (REGRAS DO PROJETO)**

- **Método**: Via terminal do Cursor usando Netlify CLI
- **Comando**: `npm run deploy`
- **Tempo**: ~3-5 minutos

### 2. **Configurações Ativas**

- **Node.js**: v18
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Headers de Segurança**: Configurados

### 3. **Scripts Disponíveis (PADRÃO DO PROJETO)**

```bash
# Deploy manual (PADRÃO - Script PowerShell)
npm run deploy

# Git + Deploy completo
npm run git:deploy "mensagem do commit"

# Apenas Git (commit + push)
npm run git:commit "mensagem do commit"

# Verificar status do Git
npm run git:status

# Script antigo (não recomendado)
npm run deploy:old

# Desenvolvimento local
npm run dev
```

**📋 Processo Padrão:**

1. **Git separado do Deploy** (recomendado)
2. **Scripts PowerShell nativos** para Windows
3. **Ignora automaticamente** arquivos `.netlify/`

### 4. **Como Fazer Deploy (PROCESSO PADRÃO)**

**Opção 1: Git e Deploy Separados (Recomendado)**

1. Fazer Git primeiro:
   ```bash
   npm run git:commit "Descrição das mudanças"
   ```
2. Fazer Deploy:
   ```bash
   npm run deploy
   ```

**Opção 2: Git + Deploy em um Comando**

```bash
npm run git:deploy "Descrição das mudanças"
```

**O que o script de deploy faz:**

- Verifica Netlify CLI
- Limpa builds anteriores
- Instala dependências (se necessário)
- Faz build de produção
- Faz deploy no Netlify
- Mostra a URL do site

## 📋 Checklist de Deploy

### ✅ **Antes do Deploy**

- [ ] Código testado localmente
- [ ] Build funcionando (`npm run build`)
- [ ] Linting passando (`npm run lint`)
- [ ] TypeScript sem erros (`npm run type-check`)

### ✅ **Durante o Deploy**

- [ ] Build local em progresso
- [ ] Netlify deploy em progresso
- [ ] Logs sem erros

### ✅ **Após o Deploy**

- [ ] Site acessível
- [ ] Funcionalidades testadas
- [ ] Performance verificada

## 🔍 Monitoramento

### **Netlify Dashboard**

- Acesse: `https://app.netlify.com/sites/fincontrol-app`
- Verifique deploys
- Logs de build e deploy
- Status do site

## 🚨 Troubleshooting

### **Deploy Falhou**

1. Verifique logs do terminal
2. Verifique logs do Netlify Dashboard
3. Teste build local: `npm run build`
4. Corrija erros e execute `npm run deploy` novamente

### **Script Travando na Verificação de Processos Node.js**

**Problema:**

- O script `deploy-manual.js` trava na etapa "🛑 Parando processos Node.js..."
- O terminal fica parado sem continuar o deploy
- O comando `execSync` com `taskkill` ou PowerShell bloqueia indefinidamente

**Sintomas:**

```
🛑 Parando processos Node.js...
[Script trava aqui e não continua]
```

**Causa:**

- Comandos `execSync` com `taskkill` ou PowerShell podem travar em alguns ambientes Windows
- Timeouts não funcionam corretamente em alguns casos
- Verificação de processos não é crítica para o deploy

**Solução:**

1. Remover ou comentar a seção de verificação de processos no `deploy-manual.js`
2. A verificação de processos foi removida do script (não é necessária)
3. Se arquivos estiverem bloqueados, o build do Next.js vai falhar com erro claro
4. Nesse caso, feche manualmente processos Node.js e tente novamente

**Código removido:**

```javascript
// ❌ REMOVIDO - Causava travamento
// 2. Parar processos Node.js que possam estar usando .next
console.log("🛑 Parando processos Node.js...");
try {
  if (process.platform === "win32") {
    execSync("taskkill /F /IM node.exe 2>nul", {
      stdio: "pipe",
      timeout: 2000,
    });
  } else {
    execSync("pkill -f node 2>/dev/null || true", {
      stdio: "pipe",
      timeout: 2000,
    });
  }
  console.log("✅ Verificação concluída\n");
} catch (error) {
  console.log("⚠️  Continuando...\n");
}
```

**Código atual (simplificado):**

```javascript
// ✅ ATUAL - Pula verificação de processos
console.log(
  "⏭️  Pulando verificação de processos (continuando direto para limpeza)\n"
);
```

**Prevenção:**

- Se o script travar novamente, verifique se há alguma verificação de processos
- Sempre feche processos Node.js manualmente antes do deploy se necessário
- O build do Next.js vai falhar claramente se houver arquivos bloqueados

**Data do problema:** 2025-01-07
**Status:** ✅ Resolvido

### **Site Não Atualiza**

1. Aguarde 2-5 minutos
2. Limpe cache do navegador
3. Verifique se o deploy foi concluído
4. Force refresh: `Ctrl+F5`

### **Erro: user_id null em Transações**

**Problema:**

- Erro ao criar transações: `null value in column "user_id" violates not-null constraint`
- Ocorre quando `user_id` não é fornecido durante criação de transações

**Solução:**

- Adicionar verificação explícita de usuário autenticado antes de criar transações
- Usar `supabase.auth.getUser()` e verificar `currentUser` e `userError`
- Garantir que `user_id: currentUser.id` seja sempre fornecido

**Arquivos corrigidos:**

- `app/components/TransactionForm.tsx`
- `app/components/SimpleChatModal.tsx`
- `app/components/FloatingChat.tsx`
- `app/components/WhatsAppChat.tsx`
- `app/hooks/useAccountTransfer.ts`
- `app/lib/account-transfer.ts`
- `app/components/BankTransferModal.tsx`

**Data do problema:** 2025-01-07
**Status:** ✅ Resolvido

## 📞 Suporte

- **GitHub Issues**: Para bugs e melhorias
- **Netlify Support**: Para problemas de deploy
- **Documentação**: Este arquivo

---

## 📚 Documentação Relacionada

- **GIT-AND-DEPLOY.md**: Guia completo dos scripts PowerShell (PADRÃO)
- **TROUBLESHOOTING.md**: Guia detalhado de troubleshooting
- **README.md**: Visão geral do projeto

## ✅ Processo Padrão Confirmado

**Status:** ✅ **Processo padrão estabelecido em 2025-01-07**

- ✅ Scripts PowerShell nativos (`deploy-only.ps1`, `git-commit.ps1`, `git-and-deploy.ps1`)
- ✅ Separação entre Git e Deploy
- ✅ Ignora automaticamente arquivos `.netlify/`
- ✅ Melhor compatibilidade com Windows
- ✅ Testado e funcionando em produção

**Este é o processo padrão oficial do projeto.**

---

_Última atualização: 2025-01-07_
