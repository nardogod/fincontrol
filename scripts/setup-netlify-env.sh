#!/bin/bash

# Script para configurar variáveis de ambiente no Netlify via CLI
# Requer: Netlify CLI instalado (npm install -g netlify-cli)
# Uso: bash scripts/setup-netlify-env.sh
#
# IMPORTANTE: Este script lê valores do .env.local
# NÃO commite o .env.local no git!

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configurando variáveis de ambiente no Netlify...${NC}"
echo ""

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

# Verificar se .env.local existe
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo .env.local não encontrado!${NC}"
    echo -e "${YELLOW}💡 Crie o arquivo .env.local na raiz do projeto${NC}"
    exit 1
fi

echo -e "${CYAN}📂 Carregando variáveis do .env.local...${NC}"
echo ""

# Lista de variáveis necessárias
REQUIRED_VARS=(
    "TELEGRAM_BOT_TOKEN"
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_APP_URL"
)

OPTIONAL_VARS=(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Função para ler valor do .env.local
get_env_value() {
    local key=$1
    grep "^${key}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^["'\'']//' | sed 's/["'\'']$//' | tr -d '\r\n'
}

# Verificar se todas as variáveis obrigatórias estão no .env.local
missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    value=$(get_env_value "$var")
    if [ -z "$value" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variáveis faltando no .env.local:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${YELLOW}   - ${var}${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 Adicione essas variáveis ao .env.local e tente novamente${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Todas as variáveis encontradas no .env.local${NC}"
echo ""

# Configurar variáveis obrigatórias
echo -e "${CYAN}📝 Configurando variáveis obrigatórias no Netlify...${NC}"
echo ""

success_count=0
for var in "${REQUIRED_VARS[@]}"; do
    value=$(get_env_value "$var")
    
    # Mascarar valores sensíveis no log
    if [[ "$var" == *"TOKEN"* ]] || [[ "$var" == *"KEY"* ]]; then
        masked_value="${value:0:10}..."
        echo -e "${BLUE}   ${var} = ${masked_value}${NC}"
    else
        echo -e "${BLUE}   ${var} = ${value}${NC}"
    fi
    
    if netlify env:set "$var" "$value" &> /dev/null; then
        echo -e "${GREEN}   ✅ ${var} configurado!${NC}"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}   ❌ Erro ao configurar ${var}${NC}"
    fi
    echo ""
done

# Configurar variáveis opcionais (se existirem)
echo -e "${CYAN}📝 Configurando variáveis opcionais no Netlify...${NC}"
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    value=$(get_env_value "$var")
    if [ -n "$value" ]; then
        if [[ "$var" == *"KEY"* ]]; then
            masked_value="${value:0:10}..."
            echo -e "${BLUE}   ${var} = ${masked_value}${NC}"
        else
            echo -e "${BLUE}   ${var} = ${value}${NC}"
        fi
        
        if netlify env:set "$var" "$value" &> /dev/null; then
            echo -e "${GREEN}   ✅ ${var} configurado!${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Erro ao configurar ${var} (opcional)${NC}"
        fi
        echo ""
    fi
done

echo "============================================================"
echo ""

if [ $success_count -eq ${#REQUIRED_VARS[@]} ]; then
    echo -e "${GREEN}✅ Todas as variáveis obrigatórias foram configuradas com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}📋 Próximos passos:${NC}"
    echo -e "${CYAN}   1. npm run webhook:prod - Configurar webhook do Telegram${NC}"
    echo -e "${CYAN}   2. npm run deploy - Fazer deploy da aplicação${NC}"
    echo -e "${CYAN}   3. npm run webhook:check - Verificar se webhook está funcionando${NC}"
    echo ""
    echo -e "${BLUE}💡 Para verificar variáveis configuradas:${NC}"
    echo -e "${CYAN}   netlify env:list${NC}"
else
    echo -e "${YELLOW}⚠️  ${success_count}/${#REQUIRED_VARS[@]} variáveis configuradas${NC}"
    echo ""
    echo -e "${YELLOW}💡 Configure manualmente as variáveis faltantes em:${NC}"
    echo -e "${CYAN}   https://app.netlify.com/sites/fincontrol-app/settings/env${NC}"
    exit 1
fi

