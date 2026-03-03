# Solução - Bot Respondendo em Russo

## Problema
O bot está respondendo com mensagens em russo, mas o código fonte está correto (em português).

## Causa Provável
O webhook do Telegram está apontando para outro projeto/deploy que contém código antigo ou diferente.

## Solução Imediata

### 1. Verificar Webhook Atual
Primeiro, precisamos verificar para onde o webhook está apontando:

```bash
# Substituir <TOKEN> pelo token real do bot
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### 2. Reconfigurar Webhook para o Projeto Correto

```bash
# Configurar webhook para o projeto correto na Vercel
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fincontrol-bot.vercel.app/api/telegram/webhook"}'
```

### 3. Verificar Deploy na Vercel
- Acessar: https://vercel.com/dashboard
- Verificar projeto `fincontrol-bot`
- Confirmar que o último deploy está atualizado
- Se necessário, fazer novo deploy: `vercel --prod`

### 4. Verificar Variáveis de Ambiente
Na Vercel, verificar:
- ✅ `TELEGRAM_BOT_TOKEN` - Token correto do bot
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Chave do Supabase
- ✅ `NEXT_PUBLIC_APP_URL` - URL da aplicação

### 5. Testar Bot
Após reconfigurar:
1. Enviar `/start` para o bot
2. Verificar se a resposta está em português
3. Verificar logs na Vercel para confirmar execução

## Verificação de Código

✅ **Código atual está CORRETO**:
- `app/lib/telegram/commands.ts` - Linha 84-94: Mensagem de boas-vindas em português
- Não há mensagens em russo no código fonte
- O problema está na configuração/deploy, não no código

## Próximos Passos

1. ✅ Verificar webhook atual do Telegram
2. ✅ Reconfigurar webhook se necessário
3. ✅ Fazer deploy se código não estiver atualizado
4. ✅ Testar bot após correção
5. ✅ Monitorar logs para confirmar funcionamento

## Comando para Deploy Imediato

```bash
# Fazer deploy para produção
vercel --prod

# Verificar logs após deploy
vercel logs --follow
```

