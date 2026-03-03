# 🔧 Solução Automática para Webhook do Telegram

## 🐛 Problema

O webhook do Telegram está sendo alterado automaticamente para `network-bots.adaptgroup.pro` todos os dias, exigindo correção manual diária.

**Possíveis causas:**
1. Serviço de proxy/CDN do Telegram redirecionando automaticamente
2. Configuração externa alterando o webhook
3. Token do bot sendo usado em múltiplos lugares

## ✅ Solução Implementada

Foi criada uma solução automática que verifica e corrige o webhook periodicamente:

### 1. API Route de Verificação

**Arquivo:** `app/api/telegram/verify-webhook/route.ts`

Endpoint que verifica e corrige automaticamente o webhook:

```bash
GET /api/telegram/verify-webhook?secret=SEU_SECRET
```

**Funcionalidades:**
- ✅ Verifica o webhook atual
- ✅ Detecta URLs incorretas conhecidas (`network-bots.adaptgroup.pro`, etc.)
- ✅ Corrige automaticamente se necessário
- ✅ Retorna status detalhado

### 2. GitHub Action Automática

**Arquivo:** `.github/workflows/verify-webhook.yml`

Executa **diariamente às 6h UTC** (3h horário de Brasília) para verificar e corrigir o webhook automaticamente.

**Como funciona:**
1. GitHub Actions executa o workflow diariamente
2. Chama a API de verificação com o secret configurado
3. Se o webhook estiver incorreto, corrige automaticamente
4. Registra logs para monitoramento

### 3. Script Melhorado

**Arquivo:** `scripts/verify-webhook.js`

Script local melhorado que:
- ✅ Carrega variáveis de ambiente do `.env.local`
- ✅ Usa `NEXT_PUBLIC_APP_URL` se disponível
- ✅ Detecta e corrige URLs incorretas automaticamente

## 🚀 Configuração

### Passo 1: Configurar Secret no GitHub

1. Acesse: `https://github.com/SEU_USUARIO/fincontrol/settings/secrets/actions`
2. Adicione o secret `WEBHOOK_VERIFY_SECRET` com um valor seguro (ex: gera com `openssl rand -hex 32`)

### Passo 2: Configurar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

**No GitHub Secrets (para o workflow):**
- `TELEGRAM_BOT_TOKEN`: Token do bot do Telegram
- `NEXT_PUBLIC_APP_URL`: URL da aplicação (ex: `https://fincontrol-bot.vercel.app`)
- `WEBHOOK_VERIFY_SECRET`: Secret para autenticação da API

**No Vercel/Netlify (para a API route):**
- `TELEGRAM_BOT_TOKEN`: Token do bot do Telegram
- `NEXT_PUBLIC_APP_URL`: URL da aplicação
- `WEBHOOK_VERIFY_SECRET`: Secret para autenticação (mesmo valor do GitHub)

### Passo 3: Testar Manualmente

Teste a API de verificação:

```bash
# Substitua SEU_SECRET pelo valor configurado
curl "https://fincontrol-bot.vercel.app/api/telegram/verify-webhook?secret=SEU_SECRET"
```

Ou execute o script local:

```bash
npm run webhook:verify
```

## 📋 Uso

### Verificação Manual

**Via Script:**
```bash
npm run webhook:verify
```

**Via API:**
```bash
curl "https://fincontrol-bot.vercel.app/api/telegram/verify-webhook?secret=SEU_SECRET"
```

**Via GitHub Actions:**
- Acesse: `https://github.com/SEU_USUARIO/fincontrol/actions`
- Selecione o workflow "Verify Telegram Webhook"
- Clique em "Run workflow"

### Verificação Automática

O GitHub Action executa automaticamente **diariamente às 6h UTC**. Você pode verificar os logs em:

`https://github.com/SEU_USUARIO/fincontrol/actions/workflows/verify-webhook.yml`

## 🔍 Monitoramento

### Verificar Logs do GitHub Action

1. Acesse: `https://github.com/SEU_USUARIO/fincontrol/actions`
2. Clique no workflow "Verify Telegram Webhook"
3. Veja os logs da última execução

### Verificar Status do Webhook

```bash
npm run webhook:verify
```

Ou via API do Telegram:

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## 🛡️ Segurança

- ✅ A API route requer autenticação via `secret`
- ✅ O secret não deve ser commitado no código
- ✅ Use valores aleatórios seguros para o secret
- ✅ Configure o secret tanto no GitHub quanto no Vercel/Netlify

## 📝 URLs Conhecidas Incorretas

O sistema detecta e corrige automaticamente estas URLs:
- `network-bots.adaptgroup.pro`
- `bots.cdn-global.pro`
- `fincontrol.netlify.app` (URL antiga sem `-app`)

## 🎯 Resultado Esperado

Após a configuração:
- ✅ Webhook verificado automaticamente todos os dias
- ✅ Correção automática se detectar URL incorreta
- ✅ Logs disponíveis no GitHub Actions
- ✅ Não é mais necessário executar `npm run webhook:verify` manualmente

## 🔄 Troubleshooting

### Webhook continua sendo alterado

1. Verifique se o GitHub Action está executando corretamente
2. Verifique os logs do workflow para erros
3. Confirme que o secret está configurado corretamente
4. Verifique se o token do bot não está sendo usado em outro lugar

### API retorna 401 Unauthorized

- Verifique se o `WEBHOOK_VERIFY_SECRET` está configurado corretamente
- Confirme que está usando o mesmo valor no GitHub e no Vercel/Netlify

### API retorna 500 Error

- Verifique se `TELEGRAM_BOT_TOKEN` está configurado
- Verifique se `NEXT_PUBLIC_APP_URL` está correto
- Veja os logs do Vercel/Netlify para mais detalhes

## 📚 Arquivos Criados

- ✅ `app/api/telegram/verify-webhook/route.ts` - API route de verificação
- ✅ `.github/workflows/verify-webhook.yml` - GitHub Action automática
- ✅ `scripts/verify-webhook.js` - Script melhorado (atualizado)
- ✅ `SOLUCAO-WEBHOOK-AUTOMATICA.md` - Esta documentação

## 🎉 Próximos Passos

1. ✅ Configure o secret `WEBHOOK_VERIFY_SECRET` no GitHub
2. ✅ Configure as variáveis de ambiente no Vercel/Netlify
3. ✅ Teste a API manualmente
4. ✅ Aguarde a execução automática diária
5. ✅ Monitore os logs do GitHub Action
