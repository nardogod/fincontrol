# 🚀 Quick Start - Desenvolvimento Local

## Configuração Rápida

### 1. Criar `.env.development`

Copie os valores do `.env.local` e crie `.env.development`:

```bash
# Copie manualmente ou use:
cp .env.local .env.development
```

**IMPORTANTE**: Altere `NEXT_PUBLIC_APP_URL` para:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Desenvolvimento Local

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Polling do Telegram
npm run telegram:dev
```

### 3. Após Desenvolvimento

```bash
# Reconfigurar webhook de produção
npm run webhook:prod

# Verificar
npm run webhook:check
```

## ⚠️ Lembrete

- ✅ Desenvolvimento usa `.env.development`
- ✅ Produção usa variáveis do Netlify
- ⚠️ **SEMPRE** reconfigurar webhook após desenvolvimento: `npm run webhook:prod`

