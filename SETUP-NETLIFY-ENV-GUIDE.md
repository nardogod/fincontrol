# 🔧 Guia: Configurar Variáveis de Ambiente no Netlify

## 📋 Opções Disponíveis

### Opção 1: Script Automatizado (RECOMENDADO) ⭐

Lê automaticamente **TODAS** as variáveis do `.env.local`:

```bash
npm run setup:netlify:auto
# OU
bash scripts/setup-netlify-env-auto.sh
```

**Vantagens:**
- ✅ Lê automaticamente todas as variáveis do `.env.local`
- ✅ Não precisa editar o script manualmente
- ✅ Mais seguro (não contém valores reais)
- ✅ Atualiza automaticamente quando você adiciona novas variáveis

### Opção 2: Script Node.js

```bash
npm run setup:netlify
# OU
node scripts/setup-netlify-env.js
```

**Vantagens:**
- ✅ Funciona em Windows, Linux e Mac
- ✅ Interface mais amigável
- ✅ Valida variáveis obrigatórias

### Opção 3: Script PowerShell (Windows)

```bash
npm run setup:netlify:ps
# OU
powershell -File ./scripts/setup-netlify-env.ps1
```

**Vantagens:**
- ✅ Nativo do Windows
- ✅ Interface colorida

### Opção 4: Manual (Via Dashboard)

1. Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env
2. Adicione cada variável manualmente
3. Faça um novo deploy

## 🚀 Como Usar o Script Automatizado

### Passo 1: Verificar Pré-requisitos

```bash
# Verificar se Netlify CLI está instalado
netlify --version

# Se não estiver, instale:
npm install -g netlify-cli

# Fazer login (se ainda não fez)
netlify login
```

### Passo 2: Executar Script

```bash
npm run setup:netlify:auto
```

O script irá:
1. ✅ Ler todas as variáveis do `.env.local`
2. ✅ Configurar cada uma no Netlify
3. ✅ Mostrar progresso com valores mascarados
4. ✅ Listar variáveis configuradas

### Passo 3: Verificar

```bash
# Verificar variáveis configuradas
npm run check:env

# OU
netlify env:list
```

### Passo 4: Fazer Deploy

```bash
npm run deploy
```

## 📝 Variáveis Encontradas no .env.local

Com base na análise, estas são as variáveis que serão configuradas:

1. `TELEGRAM_BOT_TOKEN` - Token do bot do Telegram
2. `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon Key do Supabase
4. `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase
5. `NEXT_PUBLIC_APP_URL` - URL de produção

## 🔒 Segurança

### ✅ Scripts Seguros (Podem ser commitados)

- `scripts/setup-netlify-env-auto.sh` - Lê do .env.local, não contém valores
- `scripts/setup-netlify-env.js` - Lê do .env.local, não contém valores
- `scripts/setup-netlify-env.ps1` - Lê do .env.local, não contém valores
- `scripts/setup-netlify-env.example.sh` - Template sem valores reais

### ⚠️ Arquivos Sensíveis (NÃO commitar)

- `.env.local` - Contém valores reais
- `.env.development` - Contém valores reais
- Qualquer script editado manualmente com valores reais

## 🎯 Fluxo Completo

```bash
# 1. Configurar variáveis no Netlify
npm run setup:netlify:auto

# 2. Verificar se foram configuradas
npm run check:env

# 3. Configurar webhook
npm run webhook:prod

# 4. Fazer deploy
npm run deploy

# 5. Verificar webhook
npm run webhook:check

# 6. Testar bot
npm run telegram:test
```

## 📊 Comparação dos Scripts

| Script | Plataforma | Leitura Automática | Valores Reais |
|--------|------------|-------------------|---------------|
| `setup-netlify-env-auto.sh` | Linux/Mac | ✅ Sim | ❌ Não |
| `setup-netlify-env.js` | Todas | ✅ Sim | ❌ Não |
| `setup-netlify-env.ps1` | Windows | ✅ Sim | ❌ Não |
| `setup-netlify-env.example.sh` | Todas | ❌ Não | ❌ Não |

## 💡 Dicas

1. **Use o script automatizado** (`setup-netlify-env-auto.sh`) - é o mais seguro e fácil
2. **Sempre verifique** após configurar: `npm run check:env`
3. **Não commite** arquivos `.env.*` no git
4. **Faça deploy** após configurar variáveis: `npm run deploy`

## 🆘 Troubleshooting

### "Netlify CLI não está instalado"
```bash
npm install -g netlify-cli
```

### "Você precisa estar logado"
```bash
netlify login
```

### "Arquivo .env.local não encontrado"
- Crie o arquivo `.env.local` na raiz do projeto
- Adicione suas variáveis de ambiente

### "Erro ao configurar variável"
- Verifique se o valor está correto no `.env.local`
- Tente configurar manualmente no dashboard do Netlify

