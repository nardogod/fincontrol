# Diagrama de Segurança — Antes e Depois

Visão do estado de segurança do FinControl desde o início desta conversa até o estado atual e (se aprovado) após o plano de correção.

---

## 1. Visão geral (Mermaid)

```mermaid
flowchart LR
  subgraph ANTES["🔴 ANTES (início da conversa)"]
    A1[Headers HTTP<br>quase nenhum]
    A2[XSS possível<br>dangerouslySetInnerHTML]
    A3[Rate limiting<br>ausente]
    A4[Dependências<br>6 vulns npm]
    A5[Pentest<br>não executado]
  end

  subgraph HOJE["🟡 HOJE (após análise + scans)"]
    B1[Headers: HSTS + X-CTO<br>faltam CSP, X-Frame]
    B2[XSS ainda presente<br>não sanitizado]
    B3[Rate limiting<br>ausente]
    B4[6 vulns npm<br>documentadas]
    B5[ZAP: 0 fail, 11 warn<br>Nuclei: 0 findings]
  end

  subgraph PLANO["🟢 DEPOIS DO PLANO (se aprovado)"]
    C1[Headers completos<br>via netlify.toml]
    C2[XSS mitigado<br>DOMPurify]
    C3[Rate limit<br>Edge + Redis]
    C4[Deps atualizadas<br>em branch/teste]
    C5[Mesmos scans<br>menos avisos]
  end

  ANTES --> HOJE
  HOJE --> PLANO
```

---

## 2. Timeline (antes → hoje → plano)

```mermaid
timeline
  title Segurança FinControl - Linha do tempo
  section Antes
    Início da conversa : Headers mínimos
                      : XSS em FloatingChat
                      : Sem rate limit
                      : npm audit não rodado
                      : Sem relatório ZAP/Nuclei
  section Hoje
    Análise + execução : Relatório de segurança analisado
                       : Gráfico de avaliação criado
                       : Headers checados (curl)
                       : npm audit executado
                       : ZAP baseline: 0 fail, 11 warn
                       : Nuclei: 0 findings
                       : Relatório + gráfico atualizados
  section Plano (se aprovado)
    Fase 1 : Headers em netlify.toml
    Fase 2 : DOMPurify no chat
    Fase 3 : Rate limiting Edge
    Fase 4 : npm audit fix (branch)
```

---

## 3. Scorecard visual (antes vs hoje vs plano)

```mermaid
block-beta
  columns 3
  block:Antes:2
    columns 1
    Headers:1
    XSS:3
    Rate limit:1
    Deps:3
    Pentest:0
  end
  block:Hoje:2
    columns 1
    Headers:2
    XSS:3
    Rate limit:1
    Deps:3
    Pentest:9
  end
  block:Plano:2
    columns 1
    Headers:8
    XSS:8
    Rate limit:7
    Deps:6
    Pentest:9
  end
```

Legenda (0–10): 0 = crítico, 10 = adequado.  
**Antes:** tudo desconhecido ou fraco. **Hoje:** pentest feito (ZAP/Nuclei), resto igual. **Plano:** melhoria em headers, XSS e rate limit; deps com cuidado.

---

## 4. Fluxo dos controles (hoje → após plano)

```mermaid
flowchart TB
  subgraph ENTRADA["Entrada (usuário / bot)"]
    U[Usuário]
    T[Telegram webhook]
  end

  subgraph HOJE["Controles HOJE"]
    H1[Next.js + Netlify]
    H2[Headers parciais]
    H3[Supabase Auth]
    H4[Sem rate limit]
    H5[Chat sem sanitize]
  end

  subgraph PLANO["Controles APÓS PLANO"]
    P1[Headers completos]
    P2[DOMPurify no chat]
    P3[Rate limit Edge]
    P4[Deps atualizadas]
  end

  U --> H1
  T --> H1
  H1 --> H2
  H1 --> H3
  H1 --> H4
  H1 --> H5

  H2 -.->|Fase 1| P1
  H5 -.->|Fase 2| P2
  H4 -.->|Fase 3| P3
  H1 -.->|Fase 4| P4
```

---

## 5. Resumo em tabela (área de segurança típica)

| Área           | Antes (início)     | Hoje (após conversa)     | Depois do plano (se aprovado)   |
|----------------|--------------------|---------------------------|---------------------------------|
| **Headers**    | Não verificados    | HSTS + X-Content-Type; faltam CSP, X-Frame, Referrer, Permissions | Todos configurados em netlify.toml |
| **XSS**        | Risco identificado | Mesmo risco (FloatingChat) | Mitigado com DOMPurify         |
| **Rate limit** | Ausente            | Ausente                    | Edge + Redis (ex.: 100/min)    |
| **Dependências** | 6 vulns (não vistas) | 6 vulns documentadas      | Reduzidas via audit fix (branch) |
| **Pentest**    | Não feito          | ZAP + Nuclei executados   | Mesmos scans, menos avisos     |
| **Documentação** | Nenhuma            | Relatório, gráfico, ZAP em linguagem simples | Plano de correção avaliado e (opcional) executado |

---

Para ver os diagramas Mermaid renderizados, use um visualizador (VS Code com extensão Mermaid, GitHub, ou [mermaid.live](https://mermaid.live)).
