# Plano de Ação — Ajustes no Export (sem quebrar o sistema)

Objetivo: melhorar controle dos dados e leitura para análise **mantendo** o que já funciona (formato CSV, import round-trip, período e multi-contas) e **adicionando** apenas o que falta, com baixo risco.

---

## Princípios do plano

1. **Retrocompatibilidade** — CSVs antigos (6 colunas) continuam válidos; novos terão colunas extras. O import deve aceitar “pelo menos” as 6 colunas obrigatórias e ignorar colunas extras.
2. **Ordem das colunas** — Manter as 6 colunas atuais na **mesma ordem**; novas colunas apenas **no final**. Assim scripts e planilhas que usam posição fixa não quebram.
3. **Implementação em fases** — Fase 1 essencial (CSV enriquecido), Fase 2 opcional (Excel na UI e histórico). Cada fase pode ser testada e revertida isoladamente.
4. **Sem remoções** — Nenhuma coluna ou comportamento atual é removido ou renomeado.

---

## Fase 1 — Enriquecer o CSV (prioridade alta)

Objetivo: adicionar colunas que melhoram controle e análise sem alterar o núcleo atual.

### 1.1 Colunas a adicionar (no final do CSV)

| Coluna           | Conteúdo                    | Exemplo        | Uso principal                          |
|------------------|-----------------------------|----------------|----------------------------------------|
| `ID`             | UUID da transação           | `abc123-...`   | Conciliação, deduplicação, auditoria   |
| `Valor_sinalizado` | Valor com sinal (entrada +, saída -) | `-150,00` ou `200,00` | Análise de fluxo sem derivar do Tipo   |
| `created_at`     | Data/hora de criação (ISO)  | `2024-01-15T10:30:00Z` | Auditoria e controle de origem         |
| `created_via`    | Origem do registro          | `web`, `api`   | Análise por canal                      |

- **ID**: usar `transaction.id` (já existe no tipo).
- **Valor_sinalizado**: se `type === 'expense'` → `-Math.abs(amount)`; se `income` → `amount`. Formato igual ao atual (vírgula decimal, 2 casas).
- **created_at**: `transaction.created_at` em ISO (ou só data, se preferir consistência com “Data”).
- **created_via**: `transaction.created_via ?? ''` (string vazia se null).

### 1.2 Onde alterar (só export)

- **Arquivo:** `app/lib/export.ts`
- **Função:** `exportToCSV`
  - Incluir as 4 novas colunas em `headers` (após "Descrição").
  - Em `rows`, para cada transação, acrescentar os 4 valores na mesma ordem.
  - Manter `formatNumberForCSV` para `Valor_sinalizado`; datas em ISO ou YYYY-MM-DD conforme padrão do projeto.

### 1.3 Import — garantir que não quebra

- **Arquivo:** `app/lib/import.ts`
- **Comportamento desejado:** o import deve continuar exigindo **apenas** as 6 colunas obrigatórias e **ignorar** colunas extras (já ocorre hoje: `hasAllHeaders` só exige que as 6 existam; `csvRowToTransaction` usa só os campos de `CSVRow`).
- **Ajuste mínimo (se necessário):** se em algum lugar houver validação rígida de “número exato de colunas”, mudar para “número de colunas >= 6” e mapear apenas as 6 conhecidas. Não remover ou renomear colunas esperadas.

### 1.4 Testes manuais sugeridos (Fase 1)

- Exportar CSV com 1 conta e 1 mês; conferir: mesmas 6 colunas iniciais + 4 novas no final; valor sinalizado negativo para Saída e positivo para Entrada.
- Re-importar esse CSV (no mesmo ou em outro ambiente): deve importar normalmente usando só Data, Tipo, Categoria, Conta, Valor (SEK), Descrição.
- Exportar CSV “vazio” (sem transações): deve gerar só cabeçalho (10 colunas); import deve continuar exigindo cabeçalho + pelo menos uma linha para dados.

---

## Fase 2 — Excel na UI e histórico (prioridade média)

Objetivo: expor o que já existe no código e melhorar rastreabilidade das exportações.

### 2.1 Botão “Exportar Excel” na página de export

- **Arquivo:** `app/export/page.tsx` e `app/components/ExportDialog.tsx`.
- **Opção A (recomendada):** segundo card “Exportar como Excel” que abre um diálogo semelhante ao do CSV (período + contas) e chama `exportToExcel` em vez de `exportToCSV`. Reaproveitar estado (datas, contas) ou duplicar a lógica só para Excel.
- **Opção B:** no mesmo `ExportDialog`, escolha de formato (CSV | Excel) e um único botão “Exportar” que chama `exportToCSV` ou `exportToExcel` conforme o selecionado.
- Garantir que o payload passado para `exportToExcel` seja o mesmo que para CSV (transações com `category` e `account`), para não quebrar a função existente.

### 2.2 Histórico de export (opcional)

- **Arquivo:** onde é feito `export_history.insert` (ex.: `ExportDialog`).
- **Ajuste:** preencher `file_size_bytes` com o tamanho do blob do arquivo gerado (CSV ou Excel), antes do insert. Não é obrigatório preencher `file_url` se não houver armazenamento de arquivo (evita mudança de arquitetura).
- Isso melhora o “controle do que saiu” sem alterar fluxo de download.

### 2.3 Testes manuais (Fase 2)

- Exportar Excel com 1 conta e 2 meses: verificar abas/agrupamento por mês e totais.
- Verificar na tabela `export_history` que `file_size_bytes` está preenchido após export.

---

## Fase 3 — Melhorias opcionais (baixa prioridade)

- **IDs de categoria e conta:** adicionar colunas `category_id` e `account_id` no CSV (após as 4 da Fase 1). Melhora estabilidade em re-imports e análises quando nomes mudam. O import pode continuar usando só os nomes; as colunas extras seriam apenas informativas.
- **Export TXT:** já existe em código; pode ser exposto na UI como mais uma opção de formato, se fizer sentido para o usuário.

---

## Ordem sugerida de implementação

1. **Fase 1.1 e 1.2** — Adicionar as 4 colunas no `exportToCSV`.
2. **Fase 1.3** — Revisar import (só se necessário) para aceitar CSVs com colunas extras.
3. **Fase 1.4** — Testes manuais (export + re-import + valor sinalizado).
4. **Fase 2.1** — Disponibilizar export Excel na UI.
5. **Fase 2.2** — Preencher `file_size_bytes` no histórico (opcional).
6. **Fase 3** — Se desejado, `category_id`/`account_id` e/ou TXT na UI.

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|------------|
| Scripts externos que assumem 6 colunas | Novas colunas só no final; scripts que usam índices 0–5 continuam válidos. Quem quiser pode passar a usar as novas. |
| Import rejeitar CSV novo | Import já aceita “tem as 6”; validar apenas que não há regra “exatamente 6 colunas”. |
| Excel com dados diferentes do CSV | Usar a mesma query e o mesmo array de transações (com `category` e `account`) para CSV e Excel. |
| Quebra de tipo em TypeScript | `ExportTransaction` já tem `id`, `created_at`, `created_via`; só garantir que o tipo usado em `exportToCSV` inclua esses campos (já inclui via `TTransaction`). |

---

## Checklist antes de considerar concluído

- [ ] CSV exportado contém as 6 colunas atuais na mesma ordem.
- [ ] CSV exportado contém, no final, as colunas ID, Valor_sinalizado, created_at, created_via.
- [ ] Um CSV exportado (com 10 colunas) re-importa sem erro e gera as mesmas transações (onde aplicável).
- [ ] Um CSV antigo (só 6 colunas) ainda re-importa (se o projeto tiver esse fluxo).
- [ ] Nenhuma coluna existente foi removida ou renomeada.
- [ ] (Fase 2) Export Excel disponível na UI e gera arquivo correto.
- [ ] (Fase 2, opcional) `export_history` registra `file_size_bytes` quando preenchido.

Com isso, o sistema mantém o que já funciona bem e passa a oferecer melhor controle e leitura para análise, sem quebrar o comportamento atual.
