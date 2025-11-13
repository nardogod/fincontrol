# 🤖 Configuração do Bot do Telegram

Este documento explica como configurar e usar o bot do Telegram para o FinControl.

## 📋 Pré-requisitos

1. Conta no Telegram
2. Token do bot do Telegram (obtido via [@BotFather](https://t.me/botfather))
3. URL pública do seu aplicativo (para webhook)

## 🚀 Configuração Inicial

### 1. Criar o Bot no Telegram

1. Abra o Telegram e procure por [@BotFather](https://t.me/botfather)
2. Envie `/newbot` e siga as instruções
3. Escolha um nome e username para o bot
4. Copie o token fornecido (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu `.env.local`:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 3. Executar o Schema SQL

Execute o arquivo `telegram-bot-setup.sql` no Supabase SQL Editor para criar as tabelas necessárias:

- `user_telegram_links` - Vincula usuários com Telegram IDs
- `telegram_auth_tokens` - Tokens temporários para autenticação
- `telegram_sessions` - Sessões temporárias para transações em andamento

### 4. Configurar o Webhook

O webhook será configurado automaticamente quando você acessar a rota:

```
GET /api/telegram/webhook?setup=true
```

Ou configure manualmente usando a API do Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-dominio.com/api/telegram/webhook"}'
```

### 5. Verificar o Webhook

```bash
curl "https://api.telegram.org/bot<SEU_TOKEN>/getWebhookInfo"
```

## 📱 Como Usar

### Para Usuários

1. Abra o Telegram e procure pelo seu bot
2. Envie `/start`
3. Clique no botão "Conectar Conta"
4. Você será redirecionado para autenticar no navegador
5. Pronto! Agora você pode usar os comandos

### Comandos Disponíveis

- `/start` - Iniciar bot e vincular conta
- `/gasto [valor] [categoria] [descrição]` - Registrar despesa
  - Exemplo: `/gasto 50` ou `/gasto 50 alimentacao mercado`
- `/receita [valor] [descrição]` - Registrar receita
  - Exemplo: `/receita 5000` ou `/receita 5000 salario`
- `/contas` - Ver suas contas
- `/hoje` - Resumo do dia
- `/mes` - Resumo do mês
- `/help` - Ver todos os comandos

## 🔧 Arquitetura

```
Telegram Bot ↔️ Webhook API (Next.js) ↔️ Supabase
```

1. Usuário envia comando no Telegram
2. Telegram envia atualização para o webhook
3. API processa o comando e interage com Supabase
4. Resposta é enviada de volta ao usuário

## 📁 Estrutura de Arquivos

```
app/
├── api/
│   └── telegram/
│       └── webhook/
│           └── route.ts          # Endpoint do webhook
├── lib/
│   └── telegram/
│       ├── bot.ts                 # Funções utilitárias do Telegram
│       └── commands.ts            # Lógica dos comandos
└── telegram/
    ├── auth/
    │   └── page.tsx               # Página de autenticação
    └── settings/
        └── page.tsx               # Página de configurações
```

## 🛠️ Desenvolvimento

### Testar Localmente

Para testar localmente, você precisa usar um túnel (ngrok, localtunnel, etc.):

1. Instale o ngrok: `npm install -g ngrok`
2. Inicie seu servidor Next.js: `npm run dev`
3. Em outro terminal: `ngrok http 3000`
4. Use a URL do ngrok para configurar o webhook

### Debug

Os logs do webhook aparecem no console do servidor. Para ver mais detalhes, adicione:

```typescript
console.log("Telegram webhook:", JSON.stringify(body, null, 2));
```

## 🔒 Segurança

- O webhook valida que as requisições vêm do Telegram
- Tokens de autenticação expiram em 10 minutos
- Sessões temporárias expiram em 10 minutos
- RLS (Row Level Security) protege os dados no Supabase

## 📝 Notas

- O bot usa `created_via: "api"` para transações criadas via Telegram
- Categorias são filtradas por conta do usuário ou categorias padrão
- O bot suporta seleção de categoria e conta via botões inline

## 🐛 Troubleshooting

### Bot não responde

1. Verifique se o webhook está configurado corretamente
2. Verifique os logs do servidor
3. Verifique se `TELEGRAM_BOT_TOKEN` está configurado

### Erro de autenticação

1. Verifique se o usuário está logado no navegador
2. Verifique se o token não expirou (válido por 10 minutos)
3. Verifique se a tabela `telegram_auth_tokens` existe

### Erro ao criar transação

1. Verifique se o usuário tem contas ativas
2. Verifique se há categorias disponíveis
3. Verifique os logs do Supabase

## 📚 Recursos

- [Documentação da API do Telegram](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/botfather)
- [Supabase Docs](https://supabase.com/docs)

