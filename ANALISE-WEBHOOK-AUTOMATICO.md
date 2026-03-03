# 🔍 Análise: Webhook sendo alterado para network-bots.adaptgroup.pro

## 🐛 Problema Identificado

O webhook do Telegram está sendo alterado automaticamente para `network-bots.adaptgroup.pro` todos os dias, exigindo correção manual com `npm run webhook:verify`.

## 🔍 Possíveis Causas

### 1. Serviço de Proxy/CDN do Telegram
O Telegram pode estar usando um serviço de proxy/CDN (`network-bots.adaptgroup.pro`) que redireciona automaticamente webhooks para servidores intermediários. Isso pode acontecer quando:
- O Telegram detecta problemas de conectividade com o servidor original
- Há configurações de rede que redirecionam tráfego
- O Telegram está usando um CDN para melhorar performance

### 2. Configuração Externa Alterando o Webhook
Algum serviço externo pode estar alterando o webhook:
- Outro script ou aplicação usando o mesmo token
- Serviço de monitoramento/configuração automática
- Bot framework ou plataforma que gerencia webhooks

### 3. Token do Bot sendo Usado em Múltiplos Lugares
Se o token do bot está sendo usado em múltiplos lugares:
- Outra aplicação pode estar reconfigurando o webhook
- Serviço de hospedagem alternativo
- Script antigo ainda em execução

## ✅ Solução Implementada

Foi criada uma **solução automática** que resolve o problema sem intervenção manual:

### 1. API Route de Verificação Automática
**Arquivo:** `app/api/telegram/verify-webhook/route.ts`

- Verifica o webhook atual
- Detecta URLs incorretas conhecidas
- Corrige automaticamente se necessário
- Pode ser chamada via HTTP ou cron job

### 2. GitHub Action Diária
**Arquivo:** `.github/workflows/verify-webhook.yml`

- Executa **diariamente às 6h UTC** (3h horário de Brasília)
- Verifica e corrige o webhook automaticamente
- Registra logs para monitoramento
- Pode ser executado manualmente quando necessário

### 3. Script Melhorado
**Arquivo:** `scripts/verify-webhook.js` (atualizado)

- Carrega variáveis de ambiente corretamente
- Usa `NEXT_PUBLIC_APP_URL` se disponível
- Detecta e corrige URLs incorretas automaticamente

## 🚀 Como Usar

### Configuração Inicial (Uma vez)

1. **Configure o secret no GitHub:**
   ```bash
   # Gere um secret seguro
   openssl rand -hex 32
   ```
   
   Adicione em: `https://github.com/SEU_USUARIO/fincontrol/settings/secrets/actions`
   - Nome: `WEBHOOK_VERIFY_SECRET`
   - Valor: (o valor gerado acima)

2. **Configure variáveis no GitHub Secrets:**
   - `TELEGRAM_BOT_TOKEN`: Token do bot
   - `NEXT_PUBLIC_APP_URL`: URL da aplicação (ex: `https://fincontrol-bot.vercel.app`)

3. **Configure variáveis no Vercel/Netlify:**
   - `TELEGRAM_BOT_TOKEN`: Token do bot
   - `NEXT_PUBLIC_APP_URL`: URL da aplicação
   - `WEBHOOK_VERIFY_SECRET`: Mesmo valor configurado no GitHub

### Uso Diário

**Não é mais necessário fazer nada!** O GitHub Action executa automaticamente todos os dias.

### Verificação Manual (Opcional)

Se quiser verificar manualmente:

```bash
npm run webhook:verify
```

Ou via API:

```bash
curl "https://fincontrol-bot.vercel.app/api/telegram/verify-webhook?secret=SEU_SECRET"
```

## 📊 Monitoramento

### Verificar Logs do GitHub Action

1. Acesse: `https://github.com/SEU_USUARIO/fincontrol/actions`
2. Clique em "Verify Telegram Webhook"
3. Veja os logs da última execução

### Verificar Status Atual

```bash
npm run webhook:verify
```

## 🎯 Resultado Esperado

Após a configuração:
- ✅ Webhook verificado automaticamente todos os dias
- ✅ Correção automática se detectar URL incorreta
- ✅ Não é mais necessário executar `npm run webhook:verify` manualmente
- ✅ Logs disponíveis no GitHub Actions para monitoramento

## 🔄 Investigação Adicional (Opcional)

Se quiser investigar a causa raiz:

1. **Verificar se o token está sendo usado em outro lugar:**
   ```bash
   # Verificar logs do Telegram
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```

2. **Verificar histórico de alterações:**
   - Monitore os logs do GitHub Action
   - Veja se há padrão de horário nas alterações
   - Verifique se há correlação com deploys ou outras ações

3. **Considerar regenerar o token:**
   - Se suspeitar que o token está comprometido
   - Gere novo token no @BotFather
   - Atualize em todos os lugares (GitHub, Vercel, etc.)

## 📝 Arquivos Criados/Modificados

- ✅ `app/api/telegram/verify-webhook/route.ts` - Nova API route
- ✅ `.github/workflows/verify-webhook.yml` - Novo workflow
- ✅ `scripts/verify-webhook.js` - Script melhorado
- ✅ `SOLUCAO-WEBHOOK-AUTOMATICA.md` - Documentação completa
- ✅ `ANALISE-WEBHOOK-AUTOMATICO.md` - Esta análise

## 🎉 Próximos Passos

1. ✅ Configure os secrets no GitHub
2. ✅ Configure as variáveis no Vercel/Netlify
3. ✅ Teste a API manualmente (opcional)
4. ✅ Aguarde a execução automática diária
5. ✅ Monitore os logs do GitHub Action

**Não será mais necessário executar `npm run webhook:verify` manualmente todos os dias!**
