# 🔧 Solução: Bot não funciona em produção

## ⚠️ Problema
O bot funciona localmente mas não funciona quando o servidor está desligado (produção).

## ✅ Solução: Configurar Variáveis de Ambiente no Netlify

### 📋 Variáveis Necessárias:

Você precisa configurar **4 variáveis** no Netlify:

1. **TELEGRAM_BOT_TOKEN**
   - Valor: `8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw`
   - Onde pegar: Já temos este valor

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Sua Service Role Key do Supabase
   - Onde pegar: Supabase Dashboard → Settings → API → Service Role Key
   - ⚠️ **IMPORTANTE:** Use a Service Role Key (não a anon key!)

3. **NEXT_PUBLIC_SUPABASE_URL**
   - Valor: URL do seu projeto Supabase
   - Onde pegar: Supabase Dashboard → Settings → API → Project URL
   - Formato: `https://xxxxx.supabase.co`

4. **NEXT_PUBLIC_APP_URL**
   - Valor: `https://fincontrol-app.netlify.app`
   - ⚠️ **Deve ser exatamente esta URL!**

## 🔍 Como Verificar/Configurar:

1. **Acesse o Netlify:**
   ```
   https://app.netlify.com/sites/fincontrol-app/settings/env
   ```

2. **Verifique se todas as 4 variáveis estão configuradas**

3. **Se faltar alguma, adicione:**
   - Clique em **"Add a variable"**
   - Digite o nome da variável (exatamente como está acima)
   - Digite o valor
   - Clique em **"Save"**

4. **Após adicionar/verificar, faça um novo deploy:**
   ```bash
   npm run deploy
   ```

## 🧪 Como Testar:

1. **Desligue o servidor local** (Ctrl+C no terminal do `npm run dev`)

2. **Envie `/start` no Telegram**

3. **O bot deve responder normalmente**

## 📊 Verificar Logs:

Se ainda não funcionar, verifique os logs do Netlify:

1. Acesse: https://app.netlify.com/sites/fincontrol-app/functions
2. Procure por erros relacionados a variáveis de ambiente
3. Os logs mostrarão quais variáveis estão faltando

## ❌ Erros Comuns:

- **"TELEGRAM_BOT_TOKEN não configurado"** → Adicione a variável no Netlify
- **"Variáveis do Supabase não configuradas"** → Adicione SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL
- **"Wrong response from the webhook: 404"** → Verifique se NEXT_PUBLIC_APP_URL está correto

## ✅ Checklist:

- [ ] TELEGRAM_BOT_TOKEN configurado
- [ ] SUPABASE_SERVICE_ROLE_KEY configurado
- [ ] NEXT_PUBLIC_SUPABASE_URL configurado
- [ ] NEXT_PUBLIC_APP_URL = `https://fincontrol-app.netlify.app`
- [ ] Deploy feito após configurar variáveis
- [ ] Webhook configurado: `npm run telegram:fix`

