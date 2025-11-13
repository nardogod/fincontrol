# 🐛 Troubleshooting - Bot Telegram Não Responde

## ⚠️ Problema: Bot não responde quando você envia mensagem

### ✅ Checklist de Verificação

Execute este comando primeiro:
```bash
npm run telegram:debug
```

Isso vai verificar:
1. Se o endpoint está acessível
2. Se o webhook está configurado corretamente
3. Se há erros recentes no Telegram
4. Se as tabelas existem no Supabase

---

## 🔍 Problemas Comuns e Soluções

### 1. ❌ SQL não foi executado no Supabase

**Sintoma:** Bot não responde, erro ao vincular conta

**Solução:**
1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Abra o arquivo `telegram-bot-setup.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **RUN**

**Verificar se funcionou:**
- Vá em **Table Editor**
- Procure pelas tabelas:
  - `user_telegram_links`
  - `telegram_auth_tokens`
  - `telegram_sessions`

---

### 2. ❌ Variáveis de Ambiente não configuradas no Netlify

**Sintoma:** Webhook configurado mas não funciona, erro 500

**Solução:**
1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **Site settings** → **Environment variables**
4. Adicione estas variáveis:

```
TELEGRAM_BOT_TOKEN=8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
NEXT_PUBLIC_APP_URL=https://fincontrol.netlify.app
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

5. **IMPORTANTE:** Após adicionar, faça um novo deploy:
   ```bash
   npm run deploy
   ```

---

### 3. ❌ Webhook retornando erro 500

**Sintoma:** Telegram mostra erro no webhook

**Verificar:**
```bash
npm run telegram:test
```

**Possíveis causas:**
- Variáveis de ambiente faltando no Netlify
- SQL não executado
- Erro no código

**Solução:**
1. Verifique os logs do Netlify:
   - Netlify Dashboard → Deploys → Functions Logs
   - Procure por erros relacionados ao Telegram

2. Execute o debug:
   ```bash
   npm run telegram:debug
   ```

---

### 4. ❌ Bot responde mas não cria transação

**Sintoma:** Bot responde comandos mas falha ao criar transação

**Possíveis causas:**
- Usuário não tem contas criadas
- Usuário não tem categorias disponíveis
- Erro ao inserir no banco

**Solução:**
1. Verifique se você tem pelo menos uma conta criada
2. Verifique se há categorias no sistema
3. Verifique os logs do Supabase para erros

---

### 5. ❌ Erro "Token inválido" ao vincular conta

**Sintoma:** Ao clicar em "Conectar Conta", aparece erro de token

**Possíveis causas:**
- Token expirou (válido por 10 minutos)
- SQL não foi executado
- Tabela `telegram_auth_tokens` não existe

**Solução:**
1. Execute o SQL no Supabase
2. Tente novamente enviando `/start` no bot
3. Clique em "Conectar Conta" imediatamente

---

## 🔧 Debug Passo a Passo

### Passo 1: Verificar Webhook
```bash
npm run telegram:test
```

Deve mostrar:
- ✅ Bot conectado
- ✅ Webhook configurado
- ✅ Sem erros recentes

### Passo 2: Verificar Endpoint
```bash
npm run telegram:debug
```

Isso vai:
- Testar se o endpoint está acessível
- Verificar webhook no Telegram
- Verificar se as tabelas existem
- Simular uma atualização

### Passo 3: Verificar Logs do Netlify

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **Functions** → **Logs**
4. Procure por erros relacionados a `/api/telegram/webhook`

### Passo 4: Verificar Logs do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Logs** → **Postgres Logs**
4. Procure por erros relacionados ao Telegram

---

## 📋 Checklist Completo

Execute este checklist na ordem:

- [ ] **1. SQL executado no Supabase**
  - [ ] Tabela `user_telegram_links` existe
  - [ ] Tabela `telegram_auth_tokens` existe
  - [ ] Tabela `telegram_sessions` existe

- [ ] **2. Variáveis de ambiente no Netlify**
  - [ ] `TELEGRAM_BOT_TOKEN` configurado
  - [ ] `NEXT_PUBLIC_APP_URL` configurado
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
  - [ ] Deploy feito após adicionar variáveis

- [ ] **3. Webhook configurado**
  - [ ] `npm run telegram:setup` executado
  - [ ] `npm run telegram:test` mostra sucesso
  - [ ] URL do webhook está correta

- [ ] **4. Teste básico**
  - [ ] Enviar `/start` no Telegram
  - [ ] Bot responde
  - [ ] Botão "Conectar Conta" aparece

---

## 🆘 Se Nada Funcionar

1. **Verifique os logs do Netlify:**
   - Netlify Dashboard → Functions → Logs
   - Procure por erros

2. **Verifique os logs do Telegram:**
   ```bash
   npm run telegram:test
   ```
   - Veja se há "Último erro" mostrado

3. **Teste o endpoint manualmente:**
   ```bash
   curl -X POST https://fincontrol.netlify.app/api/telegram/webhook \
     -H "Content-Type: application/json" \
     -d '{"update_id": 123, "message": {"message_id": 1, "from": {"id": 123, "first_name": "Test"}, "chat": {"id": 123}, "text": "/start", "date": 1234567890}}'
   ```

4. **Verifique se o código foi deployado:**
   - Confirme que o arquivo `app/api/telegram/webhook/route.ts` existe
   - Confirme que foi feito deploy recente

---

## 💡 Dicas

- **Sempre faça deploy após adicionar variáveis de ambiente no Netlify**
- **O SQL precisa ser executado apenas uma vez**
- **Tokens de autenticação expiram em 10 minutos**
- **Verifique os logs regularmente para identificar problemas**

---

## 📞 Próximos Passos

Se você seguiu todos os passos acima e ainda não funciona:

1. Execute: `npm run telegram:debug`
2. Copie a saída completa
3. Verifique os logs do Netlify
4. Verifique os logs do Supabase

Com essas informações, será possível identificar o problema específico.

