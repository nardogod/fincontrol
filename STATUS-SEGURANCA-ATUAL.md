# Status de Segurança — Verificação Atual

**Data da verificação:** 14/02/2026  
**Site:** https://fincontrol-app.netlify.app

---

## 1. As alterações já estão valendo no site ao vivo?

### Headers HTTP (checados agora)

| Header | Esperado (após deploy) | Resposta do site ao vivo |
|--------|-------------------------|---------------------------|
| X-Frame-Options | DENY | **Não apareceu** na resposta |
| X-Content-Type-Options | nosniff | ✅ Presente |
| Referrer-Policy | strict-origin-when-cross-origin | **Não apareceu** |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | **Não apareceu** |
| Content-Security-Policy | (política definida) | **Não apareceu** |
| Strict-Transport-Security | max-age=31536000... | ✅ Presente |

**Conclusão:** Os headers que adicionamos no `netlify.toml` da raiz **ainda não aparecem** na resposta do site. Ou o deploy não terminou / não usou esse arquivo, ou há cache CDN. O `netlify.toml` que está no repositório (raiz) tem os headers corretos; o Netlify usa por padrão o `netlify.toml` da raiz do repo.

**O que fazer:** No Netlify: **Site configuration > Build & deploy > Build settings** e confirme que o “Config file” está como `netlify.toml` (ou em branco, que usa a raiz). Confira se o último deploy concluiu com sucesso e, se quiser, faça um **Clear cache and retry deploy**. Depois rode de novo:  
`Invoke-WebRequest -Uri "https://fincontrol-app.netlify.app" -Method Head -UseBasicParsing` e veja se X-Frame-Options, CSP, Referrer-Policy e Permissions-Policy passam a aparecer.

---

## 2. Como estamos na questão de segurança agora?

### O que já está em produção (comportamento atual do site)

- **HTTPS:** Sim (Strict-Transport-Security presente).
- **X-Content-Type-Options:** nosniff presente.
- **Autenticação:** Supabase (cookies, sessão).
- **Código no repo (já no main, deploy pendente de refletir):**
  - Headers de segurança configurados no `netlify.toml` (ativação no site = assim que o Netlify aplicar esse toml).
  - DOMPurify no FloatingChat (XSS mitigado no código que será servido no próximo build).
  - Rate limit: só código da Edge Function; **não ativo** até configurar Upstash e `[[edge_functions]]`.
  - Dependências: `npm audit fix` aplicado (vulnerabilidades moderadas resolvidas).

### O que ainda não está “valendo” no live

- **Headers novos (X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy):** configurados no toml, mas **não vistos** na resposta atual — dependem do deploy/cache do Netlify.
- **DOMPurify / XSS:** Só valem quando o deploy que contém o novo build do Next (com o FloatingChat atualizado) estiver ativo.
- **Rate limiting:** Não ativo; ativação opcional (Upstash + config no toml).

### Dependências (npm audit)

- **4 vulnerabilidades altas** restantes (glob, next); correção exige `npm audit fix --force` (breaking).
- **0 moderadas** após o `npm audit fix` já aplicado.

---

## 3. Resumo

| Aspecto | Status |
|---------|--------|
| Código e config no repo | ✅ Backup feito, push em `main`, tag `backup-pre-deploy-2026-02-14` |
| Deploy | ⏳ Push feito; headers novos ainda não vistos no live — conferir deploy e cache no Netlify |
| Headers (no live) | ⚠️ Só HSTS e X-Content-Type-Options por enquanto |
| XSS (FloatingChat) | ⏳ Mitigado no código; vale quando o deploy do novo build estiver ativo |
| Rate limit | ❌ Não ativo (código pronto, ativação opcional) |
| Dependências | ⚠️ 4 altas restantes (glob/next); moderadas corrigidas |

**Próximos passos sugeridos:**  
1) No Netlify: confirmar que o último deploy usou o `netlify.toml` da raiz e, se precisar, “Clear cache and retry deploy”.  
2) Depois do deploy: rodar de novo a checagem de headers e atualizar este arquivo com “Sim, já está valendo” para cada header.  
3) Quando quiser ativar rate limit: configurar Upstash e `[[edge_functions]]` no `netlify.toml`.
