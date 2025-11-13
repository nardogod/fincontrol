# 🔀 Separar Ambientes: Desenvolvimento vs Produção

## 📋 Visão Geral

Este projeto agora suporta **ambientes separados** para desenvolvimento e produção:

- **Produção**: Webhook ativo 24/7 no Netlify
- **Desenvolvimento**: Polling local sem afetar produção

## 🎯 Por Que Separar?

### Problema Anterior
- Desenvolvimento local removia o webhook de produção
- Usuários em produção ficavam sem resposta do bot
- Necessário reconfigurar webhook após cada sessão de dev

### Solução
- Ambiente de desenvolvimento isolado
- Produção continua funcionando durante desenvolvimento
- Configuração mais segura e profissional

## 📁 Estrutura de Arquivos

```
fincontrol/
├── .env.local              # Variáveis compartilhadas (gitignored)
├── .env.development        # Variáveis de desenvolvimento (gitignored)
├── .env.development.example # Template para .env.development
└── telegram-polling-dev.js # Script de polling (usa .env.development)
```

## 🚀 Configuração Inicial

### 1. Criar `.env.development`

```bash
# Copie o template
cp .env.development.example .env.development

# Edite com seus valores
# Use os mesmos valores do .env.local, mas com NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Conteúdo do `.env.development`

```env
# Ambiente de Desenvolvimento Local
TELEGRAM_BOT_TOKEN="seu_token_aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
NODE_ENV="development"
```

## 💻 Como Usar

### Desenvolvimento Local

```bash
# 1. Inicie o servidor Next.js
npm run dev

# 2. Em outro terminal, inicie o polling
npm run telegram:dev
```

**O que acontece:**
- ✅ Script usa `.env.development`
- ✅ Remove webhook temporariamente (apenas durante desenvolvimento)
- ✅ Processa mensagens localmente
- ⚠️ **IMPORTANTE**: Após parar o polling, reconfigurar webhook de produção

### Produção

```bash
# 1. Configure variáveis no Netlify
npm run setup:netlify

# 2. Configure webhook de produção
npm run webhook:prod

# 3. Faça deploy
npm run deploy
```

**O que acontece:**
- ✅ Webhook ativo 24/7 no Netlify
- ✅ Bot responde automaticamente
- ✅ Não afetado por desenvolvimento local

## 🔄 Fluxo de Trabalho Recomendado

### Iniciando Desenvolvimento

```bash
# 1. Verificar webhook de produção está ativo
npm run webhook:check

# 2. Iniciar desenvolvimento local
npm run dev          # Terminal 1
npm run telegram:dev # Terminal 2
```

### Finalizando Desenvolvimento

```bash
# 1. Parar polling (Ctrl+C no terminal do telegram:dev)

# 2. Reconfigurar webhook de produção
npm run webhook:prod

# 3. Verificar que está funcionando
npm run webhook:check
```

## ⚠️ Avisos Importantes

### ⚠️ Desenvolvimento Local Remove Webhook de Produção

Quando você executa `npm run telegram:dev`:
- O script **remove o webhook de produção** para permitir polling
- Usuários em produção **não receberão respostas** durante esse tempo
- **SEMPRE** reconfigurar o webhook após desenvolvimento: `npm run webhook:prod`

### ✅ Boas Práticas

1. **Desenvolva em horários de baixo uso** (se possível)
2. **Use bot de teste separado** para desenvolvimento intenso
3. **Sempre reconfigurar webhook** após desenvolvimento
4. **Verifique webhook** antes de finalizar: `npm run webhook:check`

## 🧪 Testando

### Teste Local

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: Polling
npm run telegram:dev

# Terminal 3: Envie mensagem para o bot no Telegram
# Você verá os logs no Terminal 2
```

### Teste Produção

```bash
# 1. Verificar webhook
npm run webhook:check

# 2. Enviar /start para o bot no Telegram
# 3. Verificar logs no Netlify Functions
```

## 📊 Comparação de Ambientes

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Arquivo de Config** | `.env.development` | Netlify Environment Variables |
| **URL** | `http://localhost:3000` | `https://fincontrol-app.netlify.app` |
| **Método** | Polling (`telegram:dev`) | Webhook (`webhook:prod`) |
| **Afeta Produção?** | ⚠️ Remove webhook temporariamente | ✅ Não afeta |
| **Requer Reconfiguração?** | ✅ Sim, após desenvolvimento | ❌ Não |

## 🔧 Troubleshooting

### "Webhook ainda está ativo!"
- **Causa**: Webhook de produção ainda configurado
- **Solução**: O script remove automaticamente, mas pode levar alguns segundos

### "Bot não responde em produção após desenvolvimento"
- **Causa**: Webhook não foi reconfigurado
- **Solução**: Execute `npm run webhook:prod`

### "Erro ao conectar com bot"
- **Causa**: Token incorreto ou `.env.development` não configurado
- **Solução**: Verifique `.env.development` e copie valores do `.env.local`

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
npm run telegram:dev      # Polling local (usa .env.development)

# Produção
npm run webhook:prod      # Configurar webhook de produção
npm run webhook:check     # Verificar status do webhook
npm run telegram:test     # Testar conexão (não modifica webhook)

# Configuração
npm run setup:netlify      # Configurar variáveis no Netlify
npm run check:env          # Verificar variáveis no Netlify
```

## ✅ Checklist

### Antes de Desenvolver
- [ ] `.env.development` criado e configurado
- [ ] Webhook de produção verificado (`npm run webhook:check`)
- [ ] Servidor Next.js rodando (`npm run dev`)

### Durante Desenvolvimento
- [ ] Polling local ativo (`npm run telegram:dev`)
- [ ] Testando funcionalidades localmente
- [ ] Logs aparecendo no terminal

### Após Desenvolvimento
- [ ] Polling parado (Ctrl+C)
- [ ] Webhook de produção reconfigurado (`npm run webhook:prod`)
- [ ] Webhook verificado (`npm run webhook:check`)
- [ ] Bot testado em produção (enviar `/start`)

