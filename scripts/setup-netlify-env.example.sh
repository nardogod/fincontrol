#!/bin/bash

# TEMPLATE: Script para configurar variáveis de ambiente no Netlify
# 
# INSTRUÇÕES:
# 1. Copie este arquivo para setup-netlify-env.sh
# 2. Substitua os valores placeholder pelos valores reais do seu .env.local
# 3. Execute: bash scripts/setup-netlify-env.sh
#
# OU use o script automatizado:
# bash scripts/setup-netlify-env-auto.sh
# (ele lê automaticamente do .env.local)

set -e

echo "🔧 Configurando variáveis de ambiente no Netlify..."
echo ""

# Verificar se Netlify CLI está instalado
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI não está instalado!"
    echo "💡 Instale com: npm install -g netlify-cli"
    exit 1
fi

# Verificar se está logado no Netlify
if ! netlify status &> /dev/null; then
    echo "⚠️  Você precisa estar logado no Netlify CLI"
    echo "💡 Execute: netlify login"
    exit 1
fi

echo "📋 Configurando cada variável..."
echo ""

# SUBSTITUA OS VALORES ABAIXO pelos valores reais do seu .env.local

# Token do bot Telegram
netlify env:set TELEGRAM_BOT_TOKEN "SEU_TELEGRAM_BOT_TOKEN_AQUI"

# URL da aplicação
netlify env:set NEXT_PUBLIC_APP_URL "https://fincontrol-app.netlify.app"

# Supabase
netlify env:set NEXT_PUBLIC_SUPABASE_URL "SUA_SUPABASE_URL_AQUI"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "SUA_SUPABASE_ANON_KEY_AQUI"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "SUA_SUPABASE_SERVICE_ROLE_KEY_AQUI"

# Adicione outras variáveis conforme necessário
# netlify env:set OUTRA_VARIAVEL "VALOR_AQUI"

echo ""
echo "✅ Variáveis configuradas!"
echo ""
echo "📋 Listando variáveis configuradas:"
netlify env:list

echo ""
echo "🚀 Para fazer redeploy e aplicar mudanças:"
echo "   netlify deploy --prod"
echo ""
echo "✅ Configuração completa!"
echo "⏰ Aguarde 1-2 minutos e teste com: npm run telegram:test"

