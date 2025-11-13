# ✅ Como Executar o SQL no Supabase

## ⚠️ IMPORTANTE: Use o arquivo correto!

**NÃO copie arquivos `.md` (Markdown)** - eles são apenas documentação!

**Use APENAS arquivos `.sql`** - esses são os comandos SQL reais.

---

## 📋 Passo a Passo

### 1. Abra o arquivo SQL correto

Use um destes arquivos:
- ✅ `telegram-bot-setup.sql` 
- ✅ `EXECUTAR-NO-SUPABASE.sql` (mais fácil de identificar)

**NÃO use:**
- ❌ `TELEGRAM-BOT-SETUP.md` (é documentação, não SQL)
- ❌ `TELEGRAM-SETUP-GUIDE.md` (é documentação, não SQL)
- ❌ `README-TELEGRAM.md` (é documentação, não SQL)

### 2. Copie TODO o conteúdo

1. Abra o arquivo `telegram-bot-setup.sql` ou `EXECUTAR-NO-SUPABASE.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

### 3. Cole no Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New query**
5. Cole o conteúdo (Ctrl+V)
6. Clique em **RUN** ou pressione `Ctrl+Enter`

### 4. Verifique se funcionou

Você deve ver:
- ✅ Mensagem de sucesso no final
- ✅ Sem erros vermelhos

Para confirmar, vá em **Table Editor** e verifique se estas tabelas existem:
- `user_telegram_links`
- `telegram_auth_tokens`
- `telegram_sessions`

---

## 🐛 Erro Comum

### Erro: "syntax error at or near #"

**Causa:** Você copiou um arquivo `.md` (Markdown) em vez de `.sql`

**Solução:**
1. Use o arquivo `telegram-bot-setup.sql` ou `EXECUTAR-NO-SUPABASE.sql`
2. NÃO use arquivos que terminam em `.md`

---

## ✅ Checklist

- [ ] Abri o arquivo `.sql` (não `.md`)
- [ ] Copiei TODO o conteúdo
- [ ] Colei no SQL Editor do Supabase
- [ ] Cliquei em RUN
- [ ] Vi mensagem de sucesso
- [ ] Verifiquei que as tabelas foram criadas

---

## 📝 Arquivos SQL Disponíveis

- `telegram-bot-setup.sql` - Setup completo do Telegram Bot
- `EXECUTAR-NO-SUPABASE.sql` - Versão mais clara do mesmo SQL

Ambos fazem a mesma coisa, use qualquer um!

