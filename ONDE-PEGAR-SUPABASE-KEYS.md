# 🔑 Onde Pegar as Chaves do Supabase

## 📍 Passo a Passo para Encontrar as Chaves

### 1. Acesse o Supabase Dashboard

1. Vá para: https://app.supabase.com
2. Faça login na sua conta
3. Selecione seu projeto (`fincontrol` ou o nome do seu projeto)

### 2. Encontre as Chaves

#### Opção A: Pela Página de Settings (Mais Fácil)

1. No menu lateral esquerdo, clique em **Settings** (⚙️)
2. Clique em **API** (submenu dentro de Settings)
3. Você verá uma seção chamada **Project API keys**

#### Opção B: Pelo Link Direto

Acesse diretamente:
```
https://app.supabase.com/project/[SEU_PROJECT_ID]/settings/api
```

Substitua `[SEU_PROJECT_ID]` pelo ID do seu projeto.

---

## 🔑 Quais Chaves Você Precisa

### 1. **SUPABASE_SERVICE_ROLE_KEY** (Mais Importante!)

**Onde encontrar:**
- Na página de API Settings
- Procure por **`service_role`** (secret)
- ⚠️ **ATENÇÃO:** Esta é uma chave SECRETA - nunca exponha publicamente!
- Clique no ícone de **olho** 👁️ para revelar
- Clique em **Copy** para copiar

**Como identificar:**
- Está na seção **Project API keys**
- Tem o rótulo **`service_role`** (secret)
- É uma string longa que começa com `eyJ...`

### 2. **NEXT_PUBLIC_SUPABASE_URL**

**Onde encontrar:**
- Na mesma página de API Settings
- Procure por **Project URL**
- É algo como: `https://xxxxxxxxxxxxx.supabase.co`

### 3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**

**Onde encontrar:**
- Na mesma página de API Settings
- Procure por **`anon`** `public`
- Clique em **Copy** para copiar

---

## 📋 Exemplo Visual

Na página de API Settings você verá algo assim:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co
[Copy]

Project API keys
┌─────────────────────────────────────────┐
│ anon public                            │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│
│ [👁️ Reveal] [Copy]                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ service_role secret                     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│
│ [👁️ Reveal] [Copy]                     │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Acessei https://app.supabase.com
- [ ] Selecionei meu projeto
- [ ] Fui em Settings → API
- [ ] Copiei a **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copiei a chave **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Revelei e copiei a chave **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

- **`SUPABASE_SERVICE_ROLE_KEY`** é SECRETA e tem acesso TOTAL ao banco
- **NUNCA** commite esta chave no Git
- **NUNCA** exponha em código frontend
- **SEMPRE** use apenas em:
  - Variáveis de ambiente do servidor (Netlify/Vercel)
  - Arquivo `.env.local` (que está no `.gitignore`)
  - Código server-side apenas

### ✅ Seguro:
- ✅ `.env.local` (não vai para o Git)
- ✅ Variáveis de ambiente do Netlify
- ✅ Código server-side (API routes)

### ❌ NÃO Seguro:
- ❌ Código frontend (client-side)
- ❌ Commits no Git
- ❌ Repositórios públicos
- ❌ Console do navegador

---

## 📝 Depois de Copiar

### 1. Adicione no `.env.local` (local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Adicione no Netlify (produção)

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **Site settings** → **Environment variables**
4. Adicione cada variável:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🆘 Não Encontrou?

Se não conseguir encontrar:

1. **Verifique se está logado** no Supabase
2. **Verifique se selecionou o projeto correto**
3. **Verifique se tem permissões** de admin no projeto
4. **Tente acessar diretamente:** `https://app.supabase.com/project/_/settings/api`
   (Substitua `_` pelo ID do seu projeto)

---

## 📸 Screenshot de Referência

A página de API Settings do Supabase tem esta estrutura:

```
┌─────────────────────────────────────────────┐
│ Settings > API                               │
├─────────────────────────────────────────────┤
│                                             │
│ Project URL                                 │
│ https://xxxxx.supabase.co                   │
│ [Copy]                                      │
│                                             │
│ Project API keys                            │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ anon public                             │ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│ │
│ │ [👁️ Reveal] [Copy]                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ service_role secret                     │ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│ │
│ │ [👁️ Reveal] [Copy]                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Agora você sabe exatamente onde encontrar todas as chaves!** 🔑

