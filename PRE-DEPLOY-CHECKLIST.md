# ✅ Checklist Pré-Deploy - Funcionalidade de Convites

## 📋 Status Atual

### ✅ **Código Implementado**
- [x] Página de aceitar convites (`app/invite/[token]/page.tsx`)
- [x] Interface para convidar usuários (`app/accounts/[id]/settings/page.tsx`)
- [x] Hook para gerenciar convites (`app/hooks/useInvites.ts`)
- [x] Componente wrapper de convites (`app/components/InviteWrapper.tsx`)

### ⚠️ **Scripts SQL Pendentes**

**Script recomendado:** `create-invites-table.sql`

Este script cria:
- ✅ Tabela `account_invites` com todas as colunas necessárias (incluindo `token`)
- ✅ Índices para performance
- ✅ Políticas RLS corretas
- ✅ Trigger para `updated_at`

**⚠️ IMPORTANTE:** Execute este script no Supabase ANTES do deploy!

## 🚀 Próximos Passos

### **1. Executar Script SQL no Supabase** ⚠️ OBRIGATÓRIO

**Ação necessária:**
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o script: `create-invites-table.sql`
4. Verifique se a tabela foi criada corretamente

**Como verificar:**
```sql
-- Verificar se a tabela existe
SELECT * FROM account_invites LIMIT 1;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'account_invites';
```

### **2. Verificar Build Local** ✅ RECOMENDADO

Antes do deploy, teste o build localmente:

```bash
npm run build
```

**Verificar:**
- [ ] Build completa sem erros
- [ ] Sem erros de TypeScript
- [ ] Sem erros de linting

### **3. Fazer Deploy** 🚀

**Opção 1: Git + Deploy Separados (Recomendado)**
```bash
# 1. Fazer commit das mudanças
npm run git:commit "Implementação de sistema de convites para usuários"

# 2. Fazer deploy
npm run deploy
```

**Opção 2: Git + Deploy em um Comando**
```bash
npm run git:deploy "Implementação de sistema de convites para usuários"
```

### **4. Testar com Usuário Convidado** 🧪

Após o deploy, testar:

1. **Criar convite:**
   - Acesse uma conta compartilhada
   - Vá em Configurações > Membros
   - Convide um usuário por email

2. **Aceitar convite:**
   - Faça login com o usuário convidado
   - Acesse o link do convite (`/invite/[token]`)
   - Aceite o convite
   - Verifique se foi adicionado como membro da conta

3. **Verificar funcionalidades:**
   - [ ] Usuário convidado pode ver a conta compartilhada
   - [ ] Usuário convidado pode criar transações
   - [ ] Usuário convidado tem as permissões corretas (member/owner)

## ⚠️ Avisos Importantes

### **Antes do Deploy:**
- ✅ **OBRIGATÓRIO:** Execute o script SQL `create-invites-table.sql` no Supabase
- ✅ **RECOMENDADO:** Teste o build localmente (`npm run build`)
- ✅ **RECOMENDADO:** Verifique se não há erros de linting (`npm run lint`)

### **Após o Deploy:**
- ✅ Teste a funcionalidade completa de convites
- ✅ Verifique se os convites estão sendo salvos no banco
- ✅ Verifique se as políticas RLS estão funcionando corretamente

## 🔍 Troubleshooting

### **Erro: "relation account_invites does not exist"**
- **Causa:** Script SQL não foi executado
- **Solução:** Execute `create-invites-table.sql` no Supabase

### **Erro: "permission denied for table account_invites"**
- **Causa:** Políticas RLS não foram criadas corretamente
- **Solução:** Execute novamente o script SQL e verifique as políticas

### **Erro: "column token does not exist"**
- **Causa:** Tabela foi criada sem a coluna `token`
- **Solução:** Use o script `create-invites-table.sql` completo (não o `fix-account-invites-rls-final.sql`)

## 📝 Notas

- O script `create-invites-table.sql` é o mais completo e inclui todas as colunas necessárias
- O script `fix-account-invites-rls-final.sql` não inclui a coluna `token`, então não deve ser usado sozinho
- A funcionalidade de convites já está implementada no código, só falta executar o SQL e fazer deploy

---

**Status:** ⏳ Aguardando execução do script SQL e deploy

