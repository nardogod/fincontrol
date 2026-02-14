# Relatório de checagens de segurança — FinControl

**Data:** 14/02/2026  
**Alvo:** https://fincontrol-app.netlify.app  
**Comandos executados:** apenas testes (nenhum altera o código da aplicação).

---

## 1. npm audit — Executado

```
6 vulnerabilities (2 moderate, 4 high)
```

| Pacote   | Severidade | Problema |
|----------|------------|----------|
| glob     | high       | Command injection (-c/--cmd) |
| js-yaml  | moderate   | Prototype pollution (merge) |
| lodash   | moderate   | Prototype pollution (_.unset, _.omit) |
| next     | high       | DoS Server Components; DoS Image Optimizer; HTTP deserialization DoS |

- **Correção parcial (sem breaking):** `npm audit fix`
- **Correção total (pode ser breaking):** `npm audit fix --force`

---

## 2. Headers HTTP — Executado

**Comando:** `Invoke-WebRequest -Uri "https://fincontrol-app.netlify.app" -Method Head -UseBasicParsing`

### Presentes
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Cache-Control`, `Content-Type`, `Server: Netlify`, `X-Powered-By: Next.js`, etc.

### Ausentes (recomendados)
- `X-Frame-Options`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`

---

## 3. OWASP ZAP — Executado

**Comando:** `docker run --rm -v "c:\LMM-proj\fincontrol:/zap/wrk" -t zaproxy/zap-stable zap-baseline.py -t https://fincontrol-app.netlify.app -r zap_report.html -d`

**Resultado:** FAIL: 0 | WARN: 11 | PASS: 56

**Relatório HTML:** `zap_report.html` (na pasta do projeto)

### 11 avisos (WARN)

| ID    | Aviso |
|-------|--------|
| 10015 | Re-examine Cache-control Directives |
| 10020 | Missing Anti-clickjacking Header (X-Frame-Options) |
| 10021 | X-Content-Type-Options Header Missing (em alguns chunks/_next/static) |
| 10027 | Information Disclosure - Suspicious Comments |
| 10037 | Server Leaks Information via "X-Powered-By" Header |
| 10038 | Content Security Policy (CSP) Header Not Set |
| 10049 | Storable and Cacheable Content |
| 10050 | Retrieved from Cache |
| 10063 | Permissions Policy Header Not Set |
| 10109 | Modern Web Application (informativo) |
| 90004 | Insufficient Site Isolation Against Spectre Vulnerability |

Para repetir o scan (com Docker rodando):
```bash
docker run --rm -v "c:\LMM-proj\fincontrol:/zap/wrk" -t zaproxy/zap-stable zap-baseline.py -t https://fincontrol-app.netlify.app -r zap_report.html -d
```

---

## 4. Nuclei — Executado

**Comando:** `nuclei -u https://fincontrol-app.netlify.app -severity critical,high,medium -o nuclei_report.txt`

**Resultado:** 0 matches (nenhuma vulnerabilidade nos níveis critical, high ou medium).  
Templates executados: 5738. Duração: ~3 min.

**Relatório:** `nuclei_report.txt`

Para repetir:
```bash
nuclei -u https://fincontrol-app.netlify.app -severity critical,high,medium -o nuclei_report.txt
```

---

## Resumo

| Checagem     | Status   | Observação |
|-------------|----------|------------|
| npm audit   | Executado | 6 vulnerabilidades; usar `npm audit fix` quando possível. |
| Headers HTTP| Executado | HSTS e X-Content-Type-Options ok; faltam CSP, X-Frame-Options, etc. |
| OWASP ZAP   | Executado | 0 falhas, 11 avisos, 56 pass. Relatório: `zap_report.html`. |
| Nuclei      | Executado | 0 achados (critical/high/medium). Relatório: `nuclei_report.txt`. |

Nenhum comando alterou o código ou o servidor; apenas leitura e testes.
