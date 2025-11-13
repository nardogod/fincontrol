#!/bin/bash

# Script para configurar TODAS as variáveis de ambiente no Netlify via CLI
# Lê automaticamente do .env.local e configura todas as variáveis encontradas
# Requer: Netlify CLI instalado (npm install -g netlify-cli)
# Uso: bash scripts/setup-netlify-env-auto.sh
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

echo -e "${BLUE}🔧 Configurando TODAS as variáveis de ambiente no Netlify...${NC}"
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

echo -e "${CYAN}📂 Lendo TODAS as variáveis do .env.local...${NC}"
echo ""

# Ler todas as variáveis do .env.local (ignorar comentários e linhas vazias)
declare -a env_vars=()
while IFS= read -r line; do
    # Ignorar comentários e linhas vazias
    if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "${line// }" ]]; then
        # Extrair nome da variável (antes do =)
        var_name=$(echo "$line" | cut -d '=' -f1 | tr -d '[:space:]')
        if [ -n "$var_name" ]; then
            env_vars+=("$var_name")
        fi
    fi
done < "$ENV_FILE"

if [ ${#env_vars[@]} -eq 0 ]; then
    echo -e "${RED}❌ Nenhuma variável encontrada no .env.local!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Encontradas ${#env_vars[@]} variável(is) no .env.local${NC}"
echo ""

# Função para ler valor do .env.local
get_env_value() {
    local key=$1
    grep "^${key}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^["'\'']//' | sed 's/["'\'']$//' | tr -d '\r\n'
}

# Configurar cada variável encontrada
echo -e "${CYAN}📝 Configurando variáveis no Netlify...${NC}"
echo ""

success_count=0
failed_vars=()

for var in "${env_vars[@]}"; do
    value=$(get_env_value "$var")
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}   ⚠️  ${var}: valor vazio, pulando...${NC}"
        continue
    fi
    
    # Mascarar valores sensíveis no log
    if [[ "$var" == *"TOKEN"* ]] || [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
        masked_value="${value:0:10}..."
        echo -e "${BLUE}   ${var} = ${masked_value}${NC}"
    else
        echo -e "${BLUE}   ${var} = ${value}${NC}"
    fi
    
    # Configurar no Netlify
    if netlify env:set "$var" "$value" &> /dev/null; then
        echo -e "${GREEN}   ✅ ${var} configurado!${NC}"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}   ❌ Erro ao configurar ${var}${NC}"
        failed_vars+=("$var")
    fi
    echo ""
done

echo "============================================================"
echo ""

if [ $success_count -eq ${#env_vars[@]} ]; then
    echo -e "${GREEN}✅ Todas as ${success_count} variáveis foram configuradas com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}📋 Próximos passos:${NC}"
    echo -e "${CYAN}   1. npm run webhook:prod - Configurar webhook do Telegram${NC}"
    echo -e "${CYAN}   2. npm run deploy - Fazer deploy da aplicação${NC}"
    echo -e "${CYAN}   3. npm run webhook:check - Verificar se webhook está funcionando${NC}"
    echo ""
    echo -e "${BLUE}💡 Para verificar variáveis configuradas:${NC}"
    echo -e "${CYAN}   netlify env:list${NC}"
    echo ""
    echo -e "${BLUE}💡 Para fazer redeploy e aplicar mudanças:${NC}"
    echo -e "${CYAN}   netlify deploy --prod${NC}"
else
    echo -e "${YELLOW}⚠️  ${success_count}/${#env_vars[@]} variáveis configuradas${NC}"
    if [ ${#failed_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Variáveis com erro:${NC}"
        for var in "${failed_vars[@]}"; do
            echo -e "${RED}   - ${var}${NC}"
        done
    fi
    echo ""
    echo -e "${YELLOW}💡 Configure manualmente as variáveis faltantes em:${NC}"
    echo -e "${CYAN}   https://app.netlify.com/sites/fincontrol-app/settings/env${NC}"
    exit 1
fi

