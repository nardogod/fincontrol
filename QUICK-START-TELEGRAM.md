# ⚡ Quick Start - Bot Telegram

## 🎯 Resumo Rápido

Você já tem o bot criado! Agora só precisa configurar 3 coisas:

## ✅ Checklist Rápido (5 minutos)

### 1️⃣ Adicionar Token no `.env.local`
```env
TELEGRAM_BOT_TOKEN=8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
NEXT_PUBLIC_APP_URL=https://seu-dominio.netlify.app
```
**Substitua `https://seu-dominio.netlify.app` pela URL real do seu app**

### 2️⃣ Executar SQL no Supabase
- Abra Supabase Dashboard → SQL Editor
- Cole o conteúdo de `telegram-bot-setup.sql`
- Clique em RUN

### 3️⃣ Configurar Webhook
```bash
npm run telegram:setup
```

### 4️⃣ Testar
```bash
npm run telegram:test
```

### 5️⃣ Usar no Telegram
- Abra: https://t.me/VelhofelipeBot
- Envie: `/start`

## 🚀 Comandos NPM Úteis

```bash
# Configurar webhook
npm run telegram:setup

# Testar conexão
npm run telegram:test
```

## 📱 Comandos do Bot

- `/start` - Vincular conta
- `/gasto 50` - Registrar despesa
- `/receita 5000` - Registrar receita
- `/hoje` - Resumo do dia
- `/mes` - Resumo do mês
- `/contas` - Ver contas
- `/help` - Ajuda

## 🐛 Problemas?

1. **Bot não responde?**
   ```bash
   npm run telegram:test
   ```

2. **Erro no webhook?**
   - Verifique se `NEXT_PUBLIC_APP_URL` está correto
   - Execute: `npm run telegram:setup`

3. **Erro ao vincular conta?**
   - Verifique se executou o SQL no Supabase
   - Verifique se está logado no navegador

---

📖 **Guia completo:** Veja `TELEGRAM-SETUP-GUIDE.md` para detalhes

