# 📝 Como Adicionar Variáveis de Ambiente no Netlify

## 🎯 Passo a Passo Completo

### 1. Acesse a Página de Environment Variables

1. Acesse: https://app.netlify.com
2. Selecione seu site (`fincontrol`)
3. Vá em **Site settings** (no menu superior)
4. Clique em **Environment variables** (no menu lateral esquerdo)

### 2. Adicionar Cada Variável

Você verá uma interface com:
- Botão **"Add a variable"** ou **"Import variables"**
- Lista de variáveis existentes (se houver)

#### Para cada variável, siga estes passos:

1. **Clique em "Add a variable"** (ou "Import variables" se quiser importar de um arquivo)

2. **Preencha os campos:**
   - **Key** (nome da variável)
   - **Value** (valor da variável)
   - **Scopes** (deixe "All scopes" - padrão)
   - **Deploy contexts** (deixe "All deploy contexts" - padrão)

3. **Clique em "Save"** ou "Add variable"

---

## 📋 Variáveis que Você Precisa Adicionar

Adicione **UMA POR VEZ** seguindo esta ordem:

### Variável 1: TELEGRAM_BOT_TOKEN

```
Key: TELEGRAM_BOT_TOKEN
Value: 8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
Scopes: All scopes
Deploy contexts: All deploy contexts
```

**Marcar como Secret?** ✅ Sim (recomendado)

---

### Variável 2: NEXT_PUBLIC_APP_URL

```
Key: NEXT_PUBLIC_APP_URL
Value: https://fincontrol.netlify.app
Scopes: All scopes
Deploy contexts: All deploy contexts
```

**Marcar como Secret?** ❌ Não (é pública)

---

### Variável 3: SUPABASE_SERVICE_ROLE_KEY

```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: sb_secret_u6LPaYUL9Iqa00X6E8jpjw_9z0RQStK
Scopes: All scopes
Deploy contexts: All deploy contexts
```

**Marcar como Secret?** ✅ Sim (OBRIGATÓRIO - é uma chave secreta!)

---

### Variável 4: NEXT_PUBLIC_SUPABASE_URL

```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://seu-projeto.supabase.co
Scopes: All scopes
Deploy contexts: All deploy contexts
```

**Marcar como Secret?** ❌ Não (é pública)

**Onde encontrar:** Supabase Dashboard → Settings → API → Project URL

---

### Variável 5: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Scopes: All scopes
Deploy contexts: All deploy contexts
```

**Marcar como Secret?** ❌ Não (é pública, mas pode marcar como secret se quiser)

**Onde encontrar:** Supabase Dashboard → Settings → API → anon public key

---

## 🎨 Interface Visual

Quando você clicar em "Add a variable", verá algo assim:

```
┌─────────────────────────────────────────┐
│ Add environment variable                 │
├─────────────────────────────────────────┤
│                                         │
│ Key: [________________]                 │
│                                         │
│ Value: [________________]               │
│                                         │
│ ☑ Secret                                │
│   Contains secret values                │
│                                         │
│ Scopes:                                 │
│ ○ All scopes                            │
│ ○ Specific scopes                        │
│                                         │
│ Deploy contexts:                        │
│ ○ All deploy contexts                   │
│ ○ Specific deploy contexts               │
│                                         │
│ [Cancel]  [Save]                        │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist

Adicione todas estas variáveis:

- [ ] `TELEGRAM_BOT_TOKEN` (marcar como Secret ✅)
- [ ] `NEXT_PUBLIC_APP_URL` (não marcar como Secret)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (marcar como Secret ✅)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (não marcar como Secret)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (opcional marcar como Secret)

---

## 🔒 Sobre "Secret"

### Quando marcar como Secret ✅

- Chaves de API privadas
- Tokens de autenticação
- Senhas
- Qualquer coisa que não deve ser exposta publicamente

**Exemplos:**
- `TELEGRAM_BOT_TOKEN` → ✅ Secret
- `SUPABASE_SERVICE_ROLE_KEY` → ✅ Secret

### Quando NÃO marcar como Secret ❌

- URLs públicas
- Chaves públicas (que começam com `NEXT_PUBLIC_`)
- Configurações que podem ser expostas

**Exemplos:**
- `NEXT_PUBLIC_APP_URL` → ❌ Não é Secret
- `NEXT_PUBLIC_SUPABASE_URL` → ❌ Não é Secret
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → ❌ Não é Secret (mas pode marcar se quiser)

---

## 📝 Importar de Arquivo (Alternativa)

Se você tem um arquivo `.env` ou `.env.local`, pode usar o botão **"Import variables"**:

1. Clique em **"Import variables"**
2. Cole o conteúdo do seu `.env.local`:

```env
TELEGRAM_BOT_TOKEN=8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw
NEXT_PUBLIC_APP_URL=https://fincontrol.netlify.app
SUPABASE_SERVICE_ROLE_KEY=sb_secret_u6LPaYUL9Iqa00X6E8jpjw_9z0RQStK
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

3. Clique em **"Import variables"**
4. Revise e ajuste quais devem ser marcadas como Secret

---

## ⚠️ IMPORTANTE: Após Adicionar

**Você DEVE fazer um novo deploy** para que as variáveis sejam aplicadas:

```bash
npm run deploy
```

Ou:

```bash
npm run git:deploy
```

As variáveis só estarão disponíveis após um novo deploy!

---

## ✅ Verificar se Funcionou

Após adicionar e fazer deploy:

1. Execute o teste:
   ```bash
   npm run telegram:test
   ```

2. Se tudo estiver OK, você verá:
   - ✅ Bot conectado
   - ✅ Webhook configurado
   - ✅ Sem erros

3. Teste no Telegram:
   - Envie `/start` para o bot
   - Deve responder com botão "Conectar Conta"

---

## 🆘 Problemas Comuns

### Variáveis não funcionam após deploy

- Verifique se fez deploy DEPOIS de adicionar as variáveis
- Verifique se os nomes estão corretos (case-sensitive)
- Verifique se não há espaços extras nos valores

### Bot não responde

- Verifique se `TELEGRAM_BOT_TOKEN` está correto
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto
- Execute `npm run telegram:debug` para diagnosticar

---

**Agora você sabe exatamente como adicionar as variáveis!** 🎉

