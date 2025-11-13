# 🔧 Corrigir Webhook - Erro 404

## 🐛 Problema Identificado

O webhook está retornando **404 Not Found** porque:

- **URL do deploy:** `https://fincontrol-app.netlify.app`
- **URL do webhook:** `https://fincontrol.netlify.app` ❌

As URLs não coincidem!

---

## ✅ Solução Rápida

### Opção 1: Atualizar Variável no Netlify (Recomendado)

1. Acesse: https://app.netlify.com
2. Selecione seu site (`fincontrol-app`)
3. Vá em **Site settings** → **Environment variables**
4. Encontre `NEXT_PUBLIC_APP_URL`
5. Altere para: `https://fincontrol-app.netlify.app`
6. Salve

### Opção 2: Reconfigurar Webhook

Execute novamente:

```bash
npm run telegram:setup
```

Isso vai reconfigurar o webhook com a URL correta.

---

## 📋 Passo a Passo Completo

### 1. Verificar URL Correta

No Netlify Dashboard, veja qual é a URL do seu site:
- Vá em **Site overview**
- A URL está no topo, algo como: `https://fincontrol-app.netlify.app`

### 2. Atualizar Variável de Ambiente

1. **Site settings** → **Environment variables**
2. Encontre `NEXT_PUBLIC_APP_URL`
3. Altere para a URL correta do seu site
4. Clique em **Save**

### 3. Reconfigurar Webhook

```bash
npm run telegram:setup
```

Isso vai:
- Ler a URL correta do `.env.local` ou Netlify
- Configurar o webhook no Telegram com a URL correta

### 4. Fazer Deploy (se necessário)

Se você alterou a variável no Netlify, pode precisar fazer deploy novamente:

```bash
npm run deploy
```

### 5. Testar

```bash
npm run telegram:test
```

Agora deve mostrar:
- ✅ Webhook configurado
- ✅ Sem erros recentes

---

## 🔍 Verificar URL do Webhook

Para verificar qual URL está configurada no Telegram:

```bash
npm run telegram:test
```

Procure por:
```
URL configurada: https://...
```

Deve ser igual à URL do seu site no Netlify.

---

## ✅ Checklist

- [ ] Identifiquei a URL correta do site no Netlify
- [ ] Atualizei `NEXT_PUBLIC_APP_URL` no Netlify
- [ ] Executei `npm run telegram:setup`
- [ ] Testei com `npm run telegram:test`
- [ ] Webhook mostra "Sem erros recentes"

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do Netlify:**
   - Netlify Dashboard → **Functions** → **Logs**
   - Procure por erros relacionados a `/api/telegram/webhook`

2. **Verifique se a rota existe:**
   - Acesse: `https://fincontrol-app.netlify.app/api/telegram/webhook`
   - Deve retornar erro 405 (Method Not Allowed) para GET
   - Se retornar 404, a rota não foi deployada

3. **Verifique o deploy:**
   - Veja se a rota `/api/telegram/webhook` aparece nos logs de build
   - Deve aparecer como: `├ ƒ /api/telegram/webhook`

---

**A URL correta é: `https://fincontrol-app.netlify.app`** ✅

