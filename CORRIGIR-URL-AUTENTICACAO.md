# 🔧 Corrigir URL de Autenticação - Erro 404

## 🐛 Problema

Ao clicar em "Conectar Conta" no Telegram, aparece:
- URL gerada: `https://fincontrol.netlify.app/telegram/auth?token=...`
- Erro: **Page not found (404)**

## ✅ Solução

A variável `NEXT_PUBLIC_APP_URL` no Netlify está com a URL errada.

### Passo a Passo:

1. **Acesse o Netlify:**
   - https://app.netlify.com
   - Selecione seu site (`fincontrol-app`)

2. **Vá em Environment Variables:**
   - **Site settings** → **Environment variables**

3. **Encontre `NEXT_PUBLIC_APP_URL`:**
   - Procure na lista de variáveis

4. **Altere para a URL correta:**
   ```
   https://fincontrol-app.netlify.app
   ```
   
   **NÃO use:**
   - ❌ `https://fincontrol.netlify.app` (errado)
   - ✅ `https://fincontrol-app.netlify.app` (correto)

5. **Salve a alteração**

6. **Faça um novo deploy:**
   ```bash
   npm run deploy
   ```

7. **Teste novamente:**
   - Envie `/start` no Telegram
   - Clique em "Conectar Conta"
   - Agora deve funcionar!

---

## 🔍 Verificar URL Correta

Para saber qual é a URL correta do seu site:

1. No Netlify Dashboard
2. Vá em **Site overview**
3. A URL está no topo da página
4. Deve ser algo como: `https://fincontrol-app.netlify.app`

---

## ⚠️ IMPORTANTE

Após alterar a variável no Netlify, você **DEVE** fazer um novo deploy para que a mudança tenha efeito!

As variáveis de ambiente são lidas durante o build, então:
1. Altere a variável no Netlify
2. Faça deploy: `npm run deploy`
3. Teste novamente

---

## ✅ Checklist

- [ ] Identifiquei a URL correta do site no Netlify
- [ ] Alterei `NEXT_PUBLIC_APP_URL` para a URL correta
- [ ] Salvei a alteração
- [ ] Fiz deploy: `npm run deploy`
- [ ] Testei enviando `/start` no Telegram
- [ ] Cliquei em "Conectar Conta"
- [ ] A página de autenticação abriu corretamente

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique se a variável foi salva:**
   - Volte em Environment variables
   - Confirme que `NEXT_PUBLIC_APP_URL` está como `https://fincontrol-app.netlify.app`

2. **Verifique se fez deploy:**
   - Veja se há um deploy recente após alterar a variável
   - Se não, execute: `npm run deploy`

3. **Verifique os logs do build:**
   - Netlify Dashboard → Deploys → Veja o último deploy
   - Confirme que não há erros

4. **Teste a URL diretamente:**
   - Acesse: `https://fincontrol-app.netlify.app/telegram/auth`
   - Deve mostrar a página de autenticação (mesmo sem token)

---

**A URL correta é: `https://fincontrol-app.netlify.app`** ✅

