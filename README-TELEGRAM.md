# 🤖 Bot Telegram - FinControl

## 📋 O que você precisa fazer AGORA:

### 1. Adicionar Token no `.env.local`

Abra o arquivo `.env.local` e adicione estas duas linhas:

```env
TELEGRAM_BOT_TOKEN=8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
NEXT_PUBLIC_APP_URL=https://seu-dominio.netlify.app
```

**⚠️ IMPORTANTE:** Substitua `https://seu-dominio.netlify.app` pela URL real do seu app publicado.

### 2. Executar SQL no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Abra o arquivo `telegram-bot-setup.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **RUN**

### 3. Configurar Webhook

Execute no terminal:

```bash
npm run telegram:setup
```

Isso vai:
- ✅ Configurar o webhook do Telegram
- ✅ Configurar os comandos do bot
- ✅ Verificar se tudo está funcionando

### 4. Testar

Execute:

```bash
npm run telegram:test
```

### 5. Usar o Bot

1. Abra o Telegram
2. Procure por: `@VelhofelipeBot` ou acesse: https://t.me/VelhofelipeBot
3. Envie: `/start`
4. Clique em "Conectar Conta"
5. Pronto! 🎉

## 📱 Comandos Disponíveis

- `/start` - Vincular sua conta
- `/gasto 50` - Registrar despesa de 50
- `/receita 5000` - Registrar receita de 5000
- `/contas` - Ver suas contas
- `/hoje` - Resumo do dia
- `/mes` - Resumo do mês
- `/help` - Ver todos os comandos

## 🐛 Problemas Comuns

### Bot não responde

```bash
npm run telegram:test
```

Verifique:
- ✅ Token está correto no `.env.local`
- ✅ URL do app está correta
- ✅ Webhook foi configurado (`npm run telegram:setup`)

### Erro ao vincular conta

Verifique:
- ✅ SQL foi executado no Supabase
- ✅ Você está logado no navegador
- ✅ `SUPABASE_SERVICE_ROLE_KEY` está configurado

### Webhook não funciona localmente

Use ngrok:
```bash
npm install -g ngrok
ngrok http 3000
# Copie a URL HTTPS e atualize NEXT_PUBLIC_APP_URL
npm run telegram:setup
```

## 📚 Documentação Completa

- **Guia rápido:** `QUICK-START-TELEGRAM.md`
- **Guia completo:** `TELEGRAM-SETUP-GUIDE.md`
- **Documentação técnica:** `TELEGRAM-BOT-SETUP.md`

## ✅ Checklist Final

- [ ] Token adicionado no `.env.local`
- [ ] URL do app configurada
- [ ] SQL executado no Supabase
- [ ] Webhook configurado (`npm run telegram:setup`)
- [ ] Bot testado (`npm run telegram:test`)
- [ ] `/start` funciona no Telegram
- [ ] Conta vinculada com sucesso

---

**Seu bot está pronto quando todos os itens acima estão marcados!** ✅

