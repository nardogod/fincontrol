# 🚀 Guia de Configuração do Bot Telegram - Passo a Passo

## ✅ Você já tem:
- ✅ Bot criado: `@VelhofelipeBot`
- ✅ Token: `8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw`

## 📋 Passo 1: Configurar Variáveis de Ambiente

### 1.1 Edite o arquivo `.env.local` e adicione:

```env
# Telegram Bot (ADICIONE ESTAS LINHAS)
TELEGRAM_BOT_TOKEN=8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
NEXT_PUBLIC_APP_URL=https://seu-dominio.netlify.app
```

**⚠️ IMPORTANTE:** 
- Substitua `https://seu-dominio.netlify.app` pela URL real do seu app
- Se estiver em desenvolvimento local, use ngrok (veja passo 5)

### 1.2 Verifique se já tem estas variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## 📋 Passo 2: Executar Schema SQL no Supabase

### 2.1 Abra o Supabase Dashboard
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**

### 2.2 Execute o Schema
1. Abra o arquivo `telegram-bot-setup.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** ou pressione `Ctrl+Enter`

### 2.3 Verificar se funcionou
Você deve ver mensagens de sucesso. As seguintes tabelas devem ser criadas:
- ✅ `user_telegram_links`
- ✅ `telegram_auth_tokens`
- ✅ `telegram_sessions`

## 📋 Passo 3: Configurar o Webhook

### Opção A: Se já está em produção (Netlify/Vercel)

1. **Certifique-se que o `.env.local` tem a URL correta:**
   ```env
   NEXT_PUBLIC_APP_URL=https://seu-app.netlify.app
   ```

2. **Execute o script de configuração:**
   ```bash
   node setup-telegram-bot.js
   ```

3. **Verifique se funcionou:**
   ```bash
   node test-telegram-bot.js
   ```

### Opção B: Se está em desenvolvimento local

1. **Instale o ngrok:**
   ```bash
   npm install -g ngrok
   # ou
   # Windows: baixe de https://ngrok.com/download
   ```

2. **Inicie o servidor Next.js:**
   ```bash
   npm run dev
   ```

3. **Em outro terminal, inicie o ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copie a URL HTTPS do ngrok** (ex: `https://abc123.ngrok.io`)

5. **Atualize o `.env.local`:**
   ```env
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

6. **Execute o script de configuração:**
   ```bash
   node setup-telegram-bot.js
   ```

## 📋 Passo 4: Testar o Bot

### 4.1 Teste básico
1. Abra o Telegram
2. Procure por `@VelhofelipeBot` ou acesse: https://t.me/VelhofelipeBot
3. Clique em **START** ou envie `/start`

### 4.2 O que deve acontecer:
- ✅ Bot responde com mensagem de boas-vindas
- ✅ Mostra botão "Conectar Conta"
- ✅ Ao clicar, abre página de autenticação

### 4.3 Se não funcionar:
```bash
# Verificar status do webhook
node test-telegram-bot.js

# Verificar logs do servidor
# (se estiver rodando localmente, veja o terminal onde está o npm run dev)
```

## 📋 Passo 5: Configurar Descrição do Bot (Opcional)

Você pode melhorar a apresentação do bot:

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/setdescription`
3. Selecione seu bot (`@VelhofelipeBot`)
4. Envie uma descrição, por exemplo:
   ```
   Bot do FinControl - Registre suas despesas e receitas rapidamente pelo Telegram!
   ```

5. Envie `/setabouttext` e adicione:
   ```
   Gerencie suas finanças pessoais pelo Telegram. Registre gastos, receitas e veja resumos diários e mensais.
   ```

## 📋 Passo 6: Usar o Bot

### Comandos disponíveis:

- `/start` - Iniciar e vincular conta
- `/gasto 50` - Registrar despesa de 50
- `/gasto 50 alimentacao mercado` - Despesa com categoria e descrição
- `/receita 5000` - Registrar receita
- `/contas` - Ver suas contas
- `/hoje` - Resumo do dia
- `/mes` - Resumo do mês
- `/help` - Ver todos os comandos

### Fluxo de uso:

1. **Primeira vez:**
   - Envie `/start`
   - Clique em "Conectar Conta"
   - Faça login no navegador
   - Pronto!

2. **Registrar despesa:**
   ```
   /gasto 50
   ```
   - Bot pede categoria (botões)
   - Bot pede conta (botões)
   - Confirmação aparece

3. **Ver resumo:**
   ```
   /hoje
   ```
   - Mostra receitas, despesas e saldo do dia

## 🐛 Troubleshooting

### Bot não responde

1. **Verifique o webhook:**
   ```bash
   node test-telegram-bot.js
   ```

2. **Verifique se o servidor está rodando:**
   - Produção: Verifique se o deploy foi feito
   - Local: Verifique se `npm run dev` está rodando

3. **Verifique os logs:**
   - Produção: Verifique logs do Netlify/Vercel
   - Local: Veja o terminal do `npm run dev`

### Erro "Token inválido"

- Verifique se `TELEGRAM_BOT_TOKEN` está correto no `.env.local`
- Certifique-se de que não há espaços extras

### Erro "Webhook não configurado"

- Execute: `node setup-telegram-bot.js`
- Verifique se `NEXT_PUBLIC_APP_URL` está correto

### Erro ao vincular conta

1. Verifique se executou o schema SQL no Supabase
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado
3. Verifique se está logado no navegador

### Bot responde mas não cria transação

1. Verifique se você tem contas criadas no sistema
2. Verifique se você tem categorias disponíveis
3. Verifique os logs do Supabase

## 📚 Arquivos Importantes

- `telegram-bot-setup.sql` - Schema do banco de dados
- `setup-telegram-bot.js` - Script para configurar webhook
- `test-telegram-bot.js` - Script para testar conexão
- `app/api/telegram/webhook/route.ts` - Endpoint do webhook
- `app/lib/telegram/commands.ts` - Lógica dos comandos

## ✅ Checklist Final

- [ ] Token adicionado no `.env.local`
- [ ] URL do app configurada no `.env.local`
- [ ] Schema SQL executado no Supabase
- [ ] Webhook configurado (`node setup-telegram-bot.js`)
- [ ] Bot testado (`/start` funciona)
- [ ] Conta vinculada com sucesso
- [ ] Teste de registro de transação funcionando

## 🎉 Pronto!

Se todos os itens acima estão marcados, seu bot está funcionando! 

Agora você pode:
- Registrar transações pelo Telegram
- Ver resumos rápidos
- Gerenciar suas finanças sem abrir o navegador

---

**Precisa de ajuda?** Verifique os logs e use `node test-telegram-bot.js` para diagnosticar problemas.

