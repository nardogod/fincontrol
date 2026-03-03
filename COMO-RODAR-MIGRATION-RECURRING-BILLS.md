# Como criar a tabela recurring_bill_payments no Supabase

O erro 404 ao abrir Contas/Dashboard some no código, mas para a funcionalidade de **Mensalidades** (contas fixas) funcionar, a tabela precisa existir no banco. Duas formas:

---

## Opção 1: Rodar pelo terminal (recomendado)

1. **Pegar a connection string do Supabase**
   - Abra [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto
   - **Settings** (ícone engrenagem) → **Database**
   - Em **Connection string** escolha **URI**
   - Copie a URL (ex.: `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`)
   - Troque `[YOUR-PASSWORD]` pela **senha do banco** (a mesma que você define em Database → Database password)

2. **Colocar no `.env.local`**
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:SUA_SENHA_AQUI@aws-0-xx.pooler.supabase.com:6543/postgres
   ```

3. **Instalar dependência e rodar a migration**
   ```bash
   npm install
   npm run db:migrate:recurring-bills
   ```
   Se der tudo certo, aparece: `Estrutura de Contas Fixas (recurring_bill_payments) criada com sucesso.`

---

## Opção 2: Rodar direto no Supabase (SQL Editor)

1. No Supabase Dashboard: **SQL Editor** → **New query**
2. Abra o arquivo **`create-recurring-bills-structure.sql`** na raiz do projeto
3. Copie todo o conteúdo e cole no editor
4. Clique em **Run**

---

Depois de criar a tabela, a página **Mensalidades** e o bloco **Restante este mês** no Dashboard passam a usar o banco normalmente.
