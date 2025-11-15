# 🚀 Deploy Automático via GitHub Actions

## ✅ O que foi configurado

Criamos uma GitHub Action que faz deploy automático no Netlify sempre que você faz push para a branch `main`.

## 📋 Como funciona

1. Você faz `git push` para a branch `main`
2. GitHub Actions é acionado automaticamente
3. O código é baixado e as dependências são instaladas
4. O build é executado (`npm run build`)
5. O deploy é feito no Netlify
6. Seu site é atualizado automaticamente

## ⚙️ Configuração necessária (IMPORTANTE)

Para ativar o deploy automático, você precisa configurar os secrets no GitHub:

### Passo 1: Obter Netlify Auth Token

1. Acesse: https://app.netlify.com/user/applications#personal-access-tokens
2. Clique em **"New access token"**
3. Dê um nome: `GitHub Actions`
4. Copie o token gerado (você não poderá vê-lo novamente!)

### Passo 2: Adicionar Secrets no GitHub

1. Acesse: https://github.com/nardogod/fincontrol/settings/secrets/actions
2. Clique em **"New repository secret"** para cada um dos seguintes:

#### Secret 1: NETLIFY_AUTH_TOKEN
- **Nome:** `NETLIFY_AUTH_TOKEN`
- **Valor:** Cole o token que você obteve no Passo 1

#### Secret 2: NETLIFY_SITE_ID
- **Nome:** `NETLIFY_SITE_ID`
- **Valor:** `d54609b4-a942-467b-bb6a-80d032a8587e`

#### Secret 3: NEXT_PUBLIC_SUPABASE_URL
- **Nome:** `NEXT_PUBLIC_SUPABASE_URL`
- **Valor:** `https://ncysankyxvwsuwbqmmtj.supabase.co`

#### Secret 4: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Nome:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Valor:** (copie do seu `.env.local`)

### Passo 3: Ativar a GitHub Action

Execute os seguintes comandos:

```bash
git add .github/workflows/deploy.yml DEPLOY-AUTOMATICO.md
git commit -m "ci: adicionar deploy automatico via GitHub Actions"
git push
```

## ✅ Verificar se funcionou

1. Após o push, acesse: https://github.com/nardogod/fincontrol/actions
2. Você deve ver um workflow em execução
3. Aguarde 3-5 minutos para o deploy completar
4. Verifique se o site foi atualizado: https://fincontrol-app.netlify.app

## 🔍 Monitorar deploys

### Via GitHub
- Acesse: https://github.com/nardogod/fincontrol/actions
- Clique no workflow mais recente para ver os logs

### Via Netlify
- Acesse: https://app.netlify.com/sites/fincontrol-app/deploys
- Veja o histórico completo de deploys

## 🎯 Vantagens

- ✅ Deploy automático a cada push
- ✅ Build nos servidores do GitHub (sem problema de Deno local)
- ✅ Histórico completo de deploys
- ✅ Logs detalhados de cada deploy
- ✅ Rollback fácil pelo Netlify Dashboard

## ⚠️ Observações

- O deploy via GitHub Actions **não requer Deno local**
- O build é feito nos servidores do GitHub (Ubuntu)
- O deploy no Netlify é feito via API (sem CLI local)
- Você ainda pode fazer deploy manual via `npm run deploy` se necessário

## 🆘 Troubleshooting

### Deploy falhou?

1. Verifique se todos os secrets estão configurados corretamente
2. Veja os logs em: https://github.com/nardogod/fincontrol/actions
3. Verifique se o build passa localmente: `npm run build`

### Site offline após deploy?

1. Acesse: https://app.netlify.com/sites/fincontrol-app/deploys
2. Encontre um deploy anterior que estava funcionando
3. Clique nos três pontos (...) → "Publish deploy"

## 📚 Arquivos relacionados

- `.github/workflows/deploy.yml` - GitHub Action de deploy
- `setup-github-secrets.ps1` - Script helper para configurar secrets
- `DEPLOY.md` - Documentação de deploy manual

