# Avaliação do Plano de Correção Seguro

**Objetivo:** Avaliar as 4 fases do plano **sem executar** — aguardar sua aprovação para implementação.

---

## Opinião por fase

### FASE 1 — Headers via netlify.toml ✅ Recomendado

| Aspecto | Avaliação |
|--------|-----------|
| **Risco** | Muito baixo. Só adiciona headers; o Netlify já usa o `netlify.toml` da raiz. Os blocos `[[headers]]` existentes (`/api/*`, etc.) continuam válidos; um novo bloco `for = "/*"` é cumulativo. |
| **CSP** | O plano usa `'unsafe-inline'` e `'unsafe-eval'` porque o Next.js costuma precisar. Isso reduz um pouco o ganho de CSP mas ainda melhora (bloqueia scripts de outros domínios). Para CSP “rígido” seria preciso refatorar (nonces/hashes). |
| **Onde aplicar** | No `netlify.toml` da **raiz** do projeto (o que o Netlify usa). Não no `.netlify/netlify.toml` se esse for só legado. |
| **Conclusão** | Quick win real. Resolve vários avisos do ZAP (X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy). **Aprovar Fase 1.** |

---

### FASE 2 — DOMPurify no FloatingChat ✅ Recomendado

| Aspecto | Avaliação |
|--------|-----------|
| **Risco** | Baixo. O único uso de `dangerouslySetInnerHTML` é para transformar `**texto**` em `<strong>texto</strong>`. Sanitizar **antes** de passar para `__html` evita XSS sem mudar a lógica de negócio. |
| **Ordem correta** | 1) Pegar o conteúdo da linha; 2) Fazer o replace de `**...**` → `<strong>...</strong>`; 3) Passar o resultado por `DOMPurify.sanitize()`; 4) Usar na `__html`. Assim mantemos o bold e removemos qualquer `<script>` ou atributo perigoso. |
| **Teste** | Enviar algo como `**<script>alert(1)</script>**` deve exibir apenas o texto, sem executar script. |
| **Conclusão** | Alinhado ao que o ZAP e o gráfico apontam. **Aprovar Fase 2.** |

---

### FASE 3 — Rate limiting (Edge + Upstash) ⚠️ Avaliar depois de 1 e 2

| Aspecto | Avaliação |
|--------|-----------|
| **Risco** | Médio. Exige conta Upstash, variáveis de ambiente e Netlify Edge. O projeto **não usa** Edge Functions hoje (não há pasta `netlify/edge-functions/` nem referência no toml). |
| **Benefício** | Protege login e webhook contra abuso (muitas requisições). O plano sugere 100 req/min por IP — pode ser pouco para usuários legítimos em telas que disparam muitas chamadas (ex.: dashboard com polling). |
| **Sugestão** | Implementar **depois** das Fases 1 e 2. Considerar limite mais alto (ex.: 200/min) ou exceções para rotas estáticas. Testar em preview antes de produção. |
| **Conclusão** | Plano faz sentido; prioridade menor que 1 e 2. **Aprovar Fase 3** quando quiser fechar a proteção de APIs, com testes em staging. |

---

### FASE 4 — Dependências (npm audit fix) ⚠️ Só com branch e testes

| Aspecto | Avaliação |
|--------|-----------|
| **Risco** | Alto. `npm audit fix` pode atualizar Next.js/React e `eslint-config-next`; `npm audit fix --force` pode pular major e quebrar build ou runtime. |
| **Estratégia** | Fazer em branch (`hotfix/security-deps`), rodar `npm run build` e testes manuais. Se quebrar, avaliar correções pontuais (atualizar só um pacote) em vez de `--force` em tudo. |
| **Conclusão** | Concordar com “último” e “não em produção direto”. **Aprovar Fase 4** apenas como passo final, após 1–3 e com validação em ambiente de teste. |

---

## Resumo da avaliação

| Fase | Recomendação | Quando |
|------|--------------|--------|
| 1 – Headers | ✅ Fazer | Imediato (quick win) |
| 2 – DOMPurify | ✅ Fazer | Em seguida |
| 3 – Rate limit | ⚠️ Fazer após 1 e 2 | Com testes em staging |
| 4 – Dependências | ⚠️ Último, em branch | Só após validar 1–3 |

**Nenhuma alteração foi feita no código ou na configuração.** Aguardando sua aprovação para executar (quais fases e em que ordem).

---

## Diagrama: Antes e Depois (segurança)

Ver arquivo `diagrama-seguranca-antes-depois.md` (Mermaid).
