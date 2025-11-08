# 🚀 Git e Deploy - Guia Completo

## ⚠️ REGRA DO PROJETO - IMPORTANTE

**🚨 O DEPLOY É SEMPRE MANUAL 🚨**

- ❌ **NÃO há deploy automático**
- ❌ **NÃO há GitHub Actions para deploy**
- ✅ **SEMPRE fazer deploy manual via terminal do Cursor**
- ✅ **PROCESSO PADRÃO: Scripts PowerShell nativos para Windows**
- ✅ **Este é o processo padrão oficial do projeto (confirmado em 2025-01-07)**

## 📋 Scripts Disponíveis

### 1. **Git (Commit + Push)**

#### Via PowerShell:
```powershell
.\git-commit.ps1 "mensagem do commit"
```

#### Via npm:
```bash
npm run git:commit "mensagem do commit"
```

**O que faz:**
- Verifica status do Git
- Adiciona todos os arquivos (exceto `.netlify/`)
- Faz commit com a mensagem fornecida
- Faz push para o repositório remoto

**Exemplo:**
```powershell
.\git-commit.ps1 "Atualização do dashboard e correções de bugs"
```

### 2. **Deploy (Apenas Deploy, sem Git)**

#### Via PowerShell:
```powershell
.\deploy-only.ps1
```

#### Via npm:
```bash
npm run deploy
```

**O que faz:**
- Verifica Netlify CLI
- Limpa builds anteriores
- Instala dependências (se necessário)
- Faz build de produção
- Faz deploy no Netlify
- Mostra URL do site

### 3. **Git + Deploy (Processo Completo)**

#### Via PowerShell:
```powershell
.\git-and-deploy.ps1 "mensagem do commit"
```

#### Via npm:
```bash
npm run git:deploy "mensagem do commit"
```

**O que faz:**
- Executa Git (commit + push)
- Se Git for bem-sucedido, executa Deploy
- Se Git falhar, aborta o deploy

**Exemplo:**
```powershell
.\git-and-deploy.ps1 "Atualização completa: dashboard, contas e correções"
```

## 🔧 Scripts NPM Disponíveis

```bash
# Git
npm run git:commit "mensagem"    # Commit + Push
npm run git:status               # Ver status do Git

# Deploy
npm run deploy                   # Apenas deploy (novo script PowerShell)
npm run deploy:old               # Deploy antigo (node deploy-manual.js)

# Git + Deploy
npm run git:deploy "mensagem"    # Git + Deploy completo
```

## 📝 Fluxo Recomendado

### **Opção 1: Git e Deploy Separados (Recomendado)**

1. **Fazer Git primeiro:**
   ```powershell
   .\git-commit.ps1 "Descrição das mudanças"
   ```

2. **Verificar se Git foi bem-sucedido**

3. **Fazer Deploy:**
   ```powershell
   .\deploy-only.ps1
   ```

### **Opção 2: Git + Deploy em um Comando**

```powershell
.\git-and-deploy.ps1 "Descrição das mudanças"
```

## 🎯 Vantagens dos Novos Scripts

### ✅ **Scripts PowerShell Nativos**
- Funcionam melhor no Windows
- Não dependem de `&&` (que não funciona no PowerShell)
- Melhor tratamento de erros

### ✅ **Separação de Responsabilidades**
- Git separado do Deploy
- Pode fazer Git sem Deploy
- Pode fazer Deploy sem Git

### ✅ **Ignorar Arquivos .netlify**
- Scripts automaticamente ignoram `.netlify/`
- Não commitam arquivos temporários do Netlify
- `.gitignore` atualizado para ignorar `.netlify/`

### ✅ **Melhor Feedback**
- Mensagens coloridas e claras
- Indicação clara de cada etapa
- Erros mais fáceis de identificar

## 🚨 Troubleshooting

### **Erro: "Não é um repositório Git"**
- Certifique-se de estar na pasta raiz do projeto
- Verifique se `.git` existe

### **Erro: "Nenhuma mudança para commitar"**
- Verifique se há mudanças com `git status`
- Arquivos `.netlify/` são automaticamente ignorados

### **Erro: "Netlify CLI não encontrado"**
- O script tentará instalar automaticamente
- Se falhar, instale manualmente: `npm install -g netlify-cli`

### **Erro: "Build travou"**
- Feche processos Node.js manualmente
- Tente novamente após alguns segundos

### **Erro: "Deploy falhou"**
- Verifique logs do terminal
- Verifique logs do Netlify Dashboard
- Teste build local: `npm run build`

## 📚 Arquivos Relacionados

- **`git-commit.ps1`**: Script para Git (commit + push)
- **`deploy-only.ps1`**: Script para Deploy (sem Git)
- **`git-and-deploy.ps1`**: Script combinado (Git + Deploy)
- **`deploy-manual.js`**: Script antigo (ainda disponível via `npm run deploy:old`)
- **`.gitignore`**: Configurado para ignorar `.netlify/` e arquivos temporários
- **`DEPLOY.md`**: Documentação detalhada de deploy

## ✅ Processo Padrão Confirmado

**Status:** ✅ **Processo padrão oficial do projeto**

- ✅ Scripts PowerShell nativos são o padrão
- ✅ Testado e funcionando em produção
- ✅ Confirmado como padrão em 2025-01-07

## 🔄 Script Antigo (Legado)

O script antigo `deploy-manual.js` ainda está disponível via:
```bash
npm run deploy:old
```

**⚠️ Não recomendado:** Use os scripts PowerShell que são o padrão do projeto.

---

_Última atualização: 2025-01-07_

