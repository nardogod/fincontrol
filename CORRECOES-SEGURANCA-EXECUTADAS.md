# Correções de Segurança Executadas

**Data:** 14/02/2026  
**Objetivo:** Plano de correção seguro sem quebrar produção.

---

## ✅ Fase 1 — Headers (aplicado)

- **Arquivo:** `netlify.toml` (raiz)
- **Alteração:** Adicionado bloco `[[headers]]` para `"/*"` com:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Content-Security-Policy` (default-src, script-src, style-src, img-src, connect-src, font-src)
- **Deploy:** No próximo deploy no Netlify os headers passam a valer para todas as rotas.

---

## ✅ Fase 2 — DOMPurify no FloatingChat (aplicado)

- **Pacotes:** `dompurify`, `@types/dompurify`
- **Arquivo:** `app/components/FloatingChat.tsx`
- **Alteração:** Conteúdo que usa `dangerouslySetInnerHTML` (formato **negrito**) agora é sanitizado com `DOMPurify.sanitize(..., { ALLOWED_TAGS: ["strong"] })` antes de exibir.
- **Risco:** Nenhum; apenas remove possíveis scripts mantendo o bold.

---

## ✅ Fase 3 — Rate limiting (criado, **não ativo**)

- **Arquivo:** `netlify/edge-functions/rate-limit.ts`
- **Comportamento:** Se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` **não** estiverem definidos no Netlify, a função **não faz nada** (a requisição segue normalmente). Assim produção não é afetada.
- **Para ativar:**
  1. Crie conta e um banco Redis em [Upstash](https://upstash.com).
  2. No Netlify: Site settings > Environment variables > adicione `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
  3. No `netlify.toml` (raiz), adicione:
     ```toml
     [[edge_functions]]
       function = "rate-limit"
       path = "/api/*"
     ```
  4. Faça um novo deploy.
- **Limite atual no código:** 100 requisições por IP por minuto (variável `RATE_LIMIT` no arquivo).

---

## ✅ Fase 4 — Dependências (parcial)

- **Comando:** `npm audit fix` (sem `--force`)
- **Resultado:** 4 pacotes atualizados; vulnerabilidades **moderadas** (js-yaml, lodash) corrigidas.
- **Restante:** 4 vulnerabilidades **altas** (glob, next) exigem `npm audit fix --force` (breaking). Não foi aplicado para não quebrar produção.
- **Build:** `npm run build` executado com sucesso após o fix (Next.js 14.2.35).

---

## Resumo

| Fase | Status        | Produção alterada? |
|------|---------------|--------------------|
| 1    | Aplicado      | Sim (headers no próximo deploy) |
| 2    | Aplicado      | Sim (comportamento do chat idêntico, só mais seguro) |
| 3    | Código criado | Não (ativa só com Upstash + config no toml) |
| 4    | Parcial       | Sim (deps atualizadas; build ok) |

Recomendação: fazer deploy em ambiente de preview primeiro, testar login, chat, webhook e dashboards; depois promover para produção.
