# 📋 Variáveis de Ambiente - Telegram Bot (Lista Completa)

## 🔍 Análise Completa dos Arquivos

### Arquivos Analisados
- ✅ `app/api/telegram/webhook/route.ts`
- ✅ `app/lib/telegram/commands.ts`
- ✅ `app/lib/telegram/bot.ts`
- ✅ `app/lib/supabase/client.ts` (referência)
- ✅ `app/lib/supabase/middleware.ts` (referência)
- ✅ `app/lib/supabase/server.ts` (referência)

---

## 📝 Variáveis de Ambiente Necessárias

### 1. TELEGRAM_BOT_TOKEN
- **Onde é usada:**
  - `app/api/telegram/webhook/route.ts` (linha 26)
  - `app/lib/telegram/bot.ts` (linha 7)
- **Descrição:** Token do bot do Telegram obtido via @BotFather
- **Formato:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Obrigatória:** ✅ SIM
- **Uso:** Autenticação com API do Telegram
- **Tem em .env.local:** ⚠️ Verificar manualmente

### 2. NEXT_PUBLIC_SUPABASE_URL
- **Onde é usada:**
  - `app/api/telegram/webhook/route.ts` (linha 38)
  - `app/lib/telegram/commands.ts` (linha 19)
  - `app/lib/supabase/client.ts` (linha 19)
  - `app/lib/supabase/middleware.ts` (linha 33)
  - `app/lib/supabase/server.ts` (linha 22)
- **Descrição:** URL do projeto Supabase
- **Formato:** `https://xxxxx.supabase.co`
- **Obrigatória:** ✅ SIM
- **Uso:** Conexão com banco de dados Supabase
- **Tem em .env.local:** ⚠️ Verificar manualmente

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Onde é usada:**
  - `app/api/telegram/webhook/route.ts` (linha 39)
  - `app/lib/telegram/commands.ts` (linha 20)
- **Descrição:** Service Role Key do Supabase (acesso completo ao banco)
- **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Obrigatória:** ✅ SIM
- **Uso:** Acesso privilegiado ao banco de dados (necessário para bot)
- **⚠️ IMPORTANTE:** Esta chave tem acesso total ao banco. NUNCA exponha no frontend!
- **Tem em .env.local:** ⚠️ Verificar manualmente

### 4. NEXT_PUBLIC_APP_URL
- **Onde é usada:**
  - `app/lib/telegram/commands.ts` (linha 205)
- **Descrição:** URL de produção da aplicação (Netlify)
- **Formato:** `https://fincontrol-app.netlify.app`
- **Obrigatória:** ⚠️ NÃO (tem fallback)
- **Fallback:** `https://fincontrol-app.netlify.app`
- **Uso:** Gerar links de autenticação do Telegram
- **Tem em .env.local:** ⚠️ Verificar manualmente

### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY (Referência)
- **Onde é usada:**
  - `app/lib/supabase/client.ts` (linha 21)
  - `app/lib/supabase/middleware.ts` (linha 34)
  - `app/lib/supabase/server.ts` (linha 24)
- **Descrição:** Anon Key do Supabase (usada no frontend)
- **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Obrigatória:** ✅ SIM (para frontend)
- **Uso:** Autenticação no frontend (não usada diretamente pelo bot)
- **Nota:** Não é usada pelo bot Telegram, mas é necessária para o app funcionar

---

## 📊 Resumo por Arquivo

### `app/api/telegram/webhook/route.ts`
Variáveis usadas:
- `TELEGRAM_BOT_TOKEN` (linha 26)
- `NEXT_PUBLIC_SUPABASE_URL` (linha 38)
- `SUPABASE_SERVICE_ROLE_KEY` (linha 39)

### `app/lib/telegram/commands.ts`
Variáveis usadas:
- `NEXT_PUBLIC_SUPABASE_URL` (linha 19)
- `SUPABASE_SERVICE_ROLE_KEY` (linha 20)
- `NEXT_PUBLIC_APP_URL` (linha 205)

### `app/lib/telegram/bot.ts`
Variáveis usadas:
- `TELEGRAM_BOT_TOKEN` (linha 7)

---

## ✅ Checklist de Variáveis

### Para o Bot Telegram Funcionar:
- [ ] `TELEGRAM_BOT_TOKEN` - Token do bot
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key
- [ ] `NEXT_PUBLIC_APP_URL` - URL de produção (opcional, tem fallback)

### Para o App Funcionar (Frontend):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon Key do Supabase

---

## 🔧 Como Verificar no .env.local

Execute no terminal:
```bash
# Windows PowerShell
Get-Content .env.local | Select-String "TELEGRAM_BOT_TOKEN|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_APP_URL"

# Linux/Mac
grep -E "TELEGRAM_BOT_TOKEN|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_APP_URL" .env.local
```

---

## 📍 Onde Configurar

### Desenvolvimento Local
Arquivo: `.env.local` (na raiz do projeto)

### Produção (Netlify)
Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env

---

## 🚨 Variáveis Críticas para o Bot

**Sem estas 3 variáveis, o bot NÃO funciona:**
1. `TELEGRAM_BOT_TOKEN`
2. `NEXT_PUBLIC_SUPABASE_URL`
3. `SUPABASE_SERVICE_ROLE_KEY`

**Variável opcional:**
- `NEXT_PUBLIC_APP_URL` (usa fallback se não configurada)

