# 🔍 Debug do Webhook em Produção

## ✅ Logs Detalhados Adicionados

Logs detalhados foram adicionados ao `app/api/telegram/webhook/route.ts` para facilitar o debug.

### Logs Implementados

- 🔔 Requisição recebida (URL, method, headers)
- 🔑 Status das variáveis de ambiente (TELEGRAM_BOT_TOKEN, Supabase)
- 📨 Body completo da requisição
- 💬 Detalhes da mensagem (texto, user ID, username)
- 🔘 Detalhes de callback queries
- ✅ Processamento de comandos
- ❌ Erros detalhados com stack trace

## 🧪 Scripts de Teste Criados

### 1. Teste do Webhook (`npm run test:webhook`)

Simula uma requisição do Telegram para o webhook de produção:

```bash
npm run test:webhook
```

**Resultado esperado:**
- ✅ Status: 200
- ✅ Resposta: `{"ok":true}`
- ✅ Logs aparecem no Netlify

### 2. Diagnóstico Completo (`npm run diagnose`)

Verifica:
- ✅ Endpoint de produção
- ✅ Variáveis de ambiente
- ✅ Status do Netlify
- ✅ Webhook do Telegram

## 📊 Como Ver Logs em Tempo Real

```bash
netlify logs:function telegram-webhook --live
```

**Em outra janela/app:**
1. Abra o Telegram
2. Envie `/start` para `@VelhofelipeBot`
3. Veja os logs aparecerem em tempo real

## 🔧 Checklist de Debugging

Execute na ordem:

```bash
# 1. Pare TUDO local
# Feche todos os terminais com npm run dev e npm run telegram:dev

# 2. Reconfigure webhook
npm run webhook:prod

# 3. Espere 10 segundos
Start-Sleep -Seconds 10  # PowerShell
# OU
sleep 10  # Bash

# 4. Teste o webhook
npm run test:webhook

# 5. Verifique webhook
npm run webhook:check

# 6. Abra logs em tempo real
netlify logs:function telegram-webhook --live

# 7. Em outra janela/app, envie /start no Telegram
```

## 🚨 Se Logs Não Aparecerem

### Problema: Telegram não está enviando updates

**Solução 1: Forçar reconfiguração do webhook**

```bash
curl -X POST "https://api.telegram.org/bot8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw/setWebhook?url=https://fincontrol-app.netlify.app/api/telegram/webhook&drop_pending_updates=true"
```

**Solução 2: Verificar webhook manualmente**

```bash
npm run webhook:check
```

**Solução 3: Verificar se endpoint está acessível**

```bash
npm run test:webhook
```

## 📝 O Que Procurar nos Logs

### ✅ Logs Esperados Quando Funciona:

```
🔔 [WEBHOOK] Requisição recebida
🔑 [WEBHOOK] TELEGRAM_BOT_TOKEN: ✅ OK
🔑 [WEBHOOK] NEXT_PUBLIC_SUPABASE_URL: ✅ OK
🔑 [WEBHOOK] SUPABASE_SERVICE_ROLE_KEY: ✅ OK
📨 [WEBHOOK] Body completo: {...}
💬 [WEBHOOK] Texto da mensagem: /start
👤 [WEBHOOK] User ID: 8353473909
🔧 [WEBHOOK] Processando comando: /start
✅ [WEBHOOK] Executando /start
✅ [WEBHOOK] /start processado com sucesso
✅ [WEBHOOK] Retornando 200 OK para Telegram
```

### ❌ Logs de Erro Comuns:

```
❌ [WEBHOOK] TELEGRAM_BOT_TOKEN: ❌ MISSING
❌ [WEBHOOK] Variáveis do Supabase não configuradas!
❌ [WEBHOOK] Erro ao processar comando: ...
```

## 🎯 Próximos Passos Após Deploy

1. **Fazer deploy com logs detalhados:**
   ```bash
   npm run deploy
   ```

2. **Aguardar 2-3 minutos** para o deploy completar

3. **Abrir logs em tempo real:**
   ```bash
   netlify logs:function telegram-webhook --live
   ```

4. **Enviar `/start` no Telegram**

5. **Verificar logs:**
   - Logs devem aparecer IMEDIATAMENTE
   - Verificar se há erros
   - Verificar se o comando foi processado

## 💡 Dicas

- ⏰ **Aguarde 2-3 minutos** após deploy antes de testar
- 📊 **Logs aparecem em tempo real** quando você envia mensagem
- 🔍 **Use `npm run diagnose`** para verificação rápida
- 🧪 **Use `npm run test:webhook`** para testar sem Telegram

## 📚 Comandos Úteis

```bash
# Testar webhook
npm run test:webhook

# Verificar webhook
npm run webhook:check

# Diagnóstico completo
npm run diagnose

# Ver logs em tempo real
netlify logs:function telegram-webhook --live

# Reconfigurar webhook
npm run webhook:prod
```

