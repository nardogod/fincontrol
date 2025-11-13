# 📋 Variáveis de Ambiente Necessárias - Telegram Bot

## Variáveis Obrigatórias

### 1. TELEGRAM_BOT_TOKEN
- **Descrição**: Token do bot do Telegram obtido via @BotFather
- **Onde usar**: `app/lib/telegram/bot.ts`, `app/api/telegram/webhook/route.ts`
- **Formato**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Exemplo**: `8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw`

### 2. NEXT_PUBLIC_SUPABASE_URL
- **Descrição**: URL do projeto Supabase
- **Onde usar**: `app/lib/telegram/commands.ts`, `app/api/telegram/webhook/route.ts`
- **Formato**: `https://xxxxx.supabase.co`
- **Onde encontrar**: Supabase Dashboard → Settings → API → Project URL

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Descrição**: Service Role Key do Supabase (acesso completo ao banco)
- **Onde usar**: `app/lib/telegram/commands.ts`, `app/api/telegram/webhook/route.ts`
- **Formato**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard → Settings → API → Service Role Key
- **⚠️ IMPORTANTE**: Esta chave tem acesso total ao banco. NUNCA exponha no frontend!

### 4. NEXT_PUBLIC_APP_URL
- **Descrição**: URL de produção da aplicação (Netlify)
- **Onde usar**: `app/lib/telegram/commands.ts` (gerar links de autenticação)
- **Formato**: `https://fincontrol-app.netlify.app`
- **Fallback**: Se não configurado, usa `https://fincontrol-app.netlify.app`
- **⚠️ IMPORTANTE**: Deve ser a URL exata do Netlify onde o app está hospedado

## Resumo das Variáveis

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=seu_token_aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Netlify (Produção)
NEXT_PUBLIC_APP_URL=https://fincontrol-app.netlify.app
```

## Como Configurar no Netlify

1. Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env
2. Clique em "Add a variable" para cada variável
3. Cole o valor correspondente
4. Salve e faça um novo deploy

## Verificação

Após configurar, execute:
```bash
npm run webhook:check
```

Isso verificará se o webhook está funcionando corretamente.

