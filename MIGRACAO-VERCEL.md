# 🚀 Migração para Vercel - Guia Completo

## ⚠️ IMPORTANTE: Teste Primeiro no Netlify

**ANTES de migrar**, teste se tudo está funcionando no Netlify:

1. Envie `/start` no Telegram
2. Teste linguagem natural: `Gasto 50 mercado conta role`
3. Verifique se registra transações corretamente

**Só migre se estiver tudo funcionando!**

## 📋 Por Que Migrar para Vercel?

### Vantagens:
- ✅ Suporte nativo para Next.js (criador do framework)
- ✅ Sem necessidade de plugins
- ✅ API Routes funcionam out-of-the-box
- ✅ Melhor performance para Next.js
- ✅ Timeout de 10s (hobby) ou 60s (pro) vs 10s/26s do Netlify
- ✅ Deploy mais rápido
- ✅ Melhor integração com Next.js

### Desvantagens:
- ⚠️ Precisa migrar variáveis de ambiente
- ⚠️ Precisa atualizar webhook do Telegram
- ⚠️ URL muda (novo domínio)

## 🚀 Passo a Passo da Migração

### PASSO 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### PASSO 2: Login na Vercel

```bash
vercel login
```

Siga as instruções no navegador.

### PASSO 3: Deploy Inicial

```bash
vercel
```

Siga os prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Escolha sua conta
- **Link to existing project?** → `N`
- **Project name?** → `fincontrol`
- **Directory?** → `./`
- **Override settings?** → `N`

### PASSO 4: Configurar Variáveis de Ambiente

**Opção A: Via CLI (recomendado)**

```bash
# Adicionar cada variável (será pedido o valor)
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

**Opção B: Via Dashboard**

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `fincontrol`
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável:
   - `TELEGRAM_BOT_TOKEN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (será `https://fincontrol.vercel.app` ou similar)

### PASSO 5: Obter URL do Vercel

Após o deploy, você receberá uma URL como:
- `https://fincontrol-xxxxx.vercel.app` (preview)
- `https://fincontrol.vercel.app` (produção, se configurado domínio)

**Anote essa URL!**

### PASSO 6: Atualizar NEXT_PUBLIC_APP_URL

```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Quando pedir o valor, cole: https://fincontrol.vercel.app (ou sua URL)
```

### PASSO 7: Deploy para Produção

```bash
vercel --prod
```

Ou use o script:

```bash
npm run deploy:vercel
```

### PASSO 8: Configurar Webhook do Telegram

**Opção A: Usar script (recomendado)**

1. Edite `scripts/set-telegram-webhook-vercel.js` e atualize `VERCEL_URL` se necessário
2. Execute:

```bash
npm run webhook:vercel
```

**Opção B: Manual**

```bash
# Substitua YOUR_VERCEL_URL pela URL do seu projeto Vercel
curl -X POST "https://api.telegram.org/bot8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram/webhook&drop_pending_updates=true"
```

### PASSO 9: Verificar Webhook

```bash
npm run webhook:check
```

Deve mostrar a URL do Vercel.

### PASSO 10: Testar Bot

1. Envie `/start` no Telegram
2. Verifique se responde
3. Teste linguagem natural: `Gasto 50 mercado conta role`
4. Verifique se registra transações

## 📝 Arquivos Criados

- ✅ `vercel.json` - Configuração do Vercel
- ✅ `scripts/set-telegram-webhook-vercel.js` - Script para configurar webhook
- ✅ Scripts no `package.json`:
  - `npm run deploy:vercel` - Deploy para produção
  - `npm run dev:vercel` - Desenvolvimento local com Vercel
  - `npm run webhook:vercel` - Configurar webhook

## 🔄 Comparação: Netlify vs Vercel

| Recurso | Netlify | Vercel |
|---------|---------|--------|
| Suporte Next.js | Com plugin | Nativo |
| API Routes | Com plugin | Nativo |
| Timeout (hobby) | 10s | 10s |
| Timeout (pro) | 26s | 60s |
| Deploy | ~2-3 min | ~1-2 min |
| Performance | Boa | Excelente |

## ⚠️ Checklist de Migração

- [ ] Vercel CLI instalado
- [ ] Login na Vercel realizado
- [ ] Deploy inicial feito
- [ ] Variáveis de ambiente configuradas
- [ ] `NEXT_PUBLIC_APP_URL` atualizado
- [ ] Deploy para produção feito
- [ ] Webhook do Telegram atualizado
- [ ] Webhook verificado
- [ ] Bot testado no Telegram
- [ ] Linguagem natural testada

## 🎯 Recomendação Final

**Teste PRIMEIRO no Netlify** para garantir que tudo está funcionando antes de migrar. A migração é simples, mas é melhor ter certeza de que o código está correto antes de mudar de plataforma.

---

**Pronto para migrar quando quiser!** 🚀

