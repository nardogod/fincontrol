#!/bin/bash

# Script para verificar variáveis de ambiente no Netlify
# Requer: Netlify CLI instalado (npm install -g netlify-cli)
# Uso: bash scripts/check-netlify-env.sh

echo "🔍 Verificando variáveis de ambiente no Netlify..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Lista de variáveis necessárias
declare -a REQUIRED_VARS=(
    "TELEGRAM_BOT_TOKEN"
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_APP_URL"
)

declare -a OPTIONAL_VARS=(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Verificar se Netlify CLI está instalado
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI não está instalado!${NC}"
    echo -e "${YELLOW}💡 Instale com: npm install -g netlify-cli${NC}"
    exit 1
fi

# Verificar se está logado no Netlify
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você precisa estar logado no Netlify CLI${NC}"
    echo -e "${CYAN}💡 Execute: netlify login${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Variáveis Obrigatórias:${NC}"
echo ""

missing_count=0
found_count=0

for var in "${REQUIRED_VARS[@]}"; do
    echo -n "   ${var}: "
    value=$(netlify env:get "$var" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$value" ]; then
        # Mascarar valores sensíveis
        if [[ "$var" == *"TOKEN"* ]] || [[ "$var" == *"KEY"* ]]; then
            masked_value="${value:0:10}..."
            echo -e "${GREEN}✅ Configurado${NC} (${masked_value})"
        else
            echo -e "${GREEN}✅ Configurado${NC} (${value})"
        fi
        found_count=$((found_count + 1))
    else
        echo -e "${RED}❌ Não configurado${NC}"
        missing_count=$((missing_count + 1))
    fi
done

echo ""
echo -e "${BLUE}📋 Variáveis Opcionais:${NC}"
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    echo -n "   ${var}: "
    value=$(netlify env:get "$var" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$value" ]; then
        if [[ "$var" == *"KEY"* ]]; then
            masked_value="${value:0:10}..."
            echo -e "${GREEN}✅ Configurado${NC} (${masked_value})"
        else
            echo -e "${GREEN}✅ Configurado${NC} (${value})"
        fi
    else
        echo -e "${YELLOW}⚠️  Não configurado (opcional)${NC}"
    fi
done

echo ""
echo "=" | tr ' ' '='
echo ""

if [ $missing_count -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as variáveis obrigatórias estão configuradas!${NC}"
    echo ""
    echo -e "${CYAN}📱 Próximos passos:${NC}"
    echo "   1. npm run webhook:prod - Configurar webhook do Telegram"
    echo "   2. npm run deploy - Fazer deploy da aplicação"
    echo "   3. npm run webhook:check - Verificar se webhook está funcionando"
    exit 0
else
    echo -e "${RED}❌ ${missing_count} variável(ões) obrigatória(s) faltando!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Configure as variáveis faltantes em:${NC}"
    echo -e "${CYAN}   https://app.netlify.com/sites/fincontrol-app/settings/env${NC}"
    echo ""
    echo -e "${CYAN}💡 OU use o script:${NC}"
    echo "   npm run setup:netlify"
    exit 1
fi

