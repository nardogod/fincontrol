# Verificar Variáveis de Ambiente no Netlify

## Variáveis Necessárias:

1. **TELEGRAM_BOT_TOKEN** - Token do bot do Telegram
2. **SUPABASE_SERVICE_ROLE_KEY** - Service Role Key do Supabase
3. **NEXT_PUBLIC_SUPABASE_URL** - URL do projeto Supabase
4. **NEXT_PUBLIC_APP_URL** - URL do site (https://fincontrol-app.netlify.app)

## Como verificar:

1. Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env
2. Verifique se todas as variáveis acima estão configuradas
3. Se alguma estiver faltando, adicione

## Como adicionar:

1. No Netlify, vá em: Site settings → Environment variables
2. Clique em "Add a variable"
3. Adicione cada variável com seu valor
4. Faça um novo deploy após adicionar
