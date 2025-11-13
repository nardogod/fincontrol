# 🤖 Desenvolvimento Local do Telegram Bot

## Como usar

### 1. Abra **DUAS** janelas do terminal:

**Terminal 1 - Servidor Next.js:**
```bash
npm run dev
```

**Terminal 2 - Polling do Telegram:**
```bash
npm run telegram:dev
```

### 2. Como funciona:

- O script `telegram-polling-dev.js` busca atualizações do Telegram a cada 1 segundo
- Quando recebe uma mensagem, envia para o webhook local (`http://localhost:3000/api/telegram/webhook`)
- **Todos os logs aparecem diretamente no Terminal 2** onde o polling está rodando
- Os logs do processamento aparecem no Terminal 1 onde o Next.js está rodando

### 3. Logs que você verá:

**No Terminal 2 (polling):**
```
📨 Nova atualização recebida
💬 Mensagem: Gasto 10 café conta role
👤 De: 8353473909
📤 Enviando para webhook local...
📥 Resposta do webhook: ✅ OK
```

**No Terminal 1 (Next.js):**
```
📨 Telegram webhook received
💬 Processando linguagem natural: "Gasto 10 café conta role"
📊 Parseado: { ... }
✅ handleNaturalLanguage finalizado
```

### 4. Parar o polling:

- Pressione `Ctrl+C` no Terminal 2
- O Terminal 1 (Next.js) continua rodando normalmente

### 5. Vantagens:

✅ Logs diretos no terminal  
✅ Não precisa de ngrok ou ferramentas externas  
✅ Desenvolvimento rápido e fácil  
✅ Funciona offline (apenas precisa de internet para Telegram API)

### 6. Importante:

⚠️ **Desative o webhook do Telegram antes de usar polling:**
```bash
npm run telegram:fix
# Ou manualmente remova o webhook no Telegram
```

⚠️ **Reative o webhook antes de fazer deploy:**
```bash
npm run telegram:setup
```

