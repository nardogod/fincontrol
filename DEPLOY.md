# 🚀 Deploy Manual - FinControl

## ⚠️ REGRA DO PROJETO

**O deploy NÃO é automático. Sempre fazer deploy manual via terminal do Cursor.**

## Status do Deploy

- ✅ **Deploy manual configurado**
- ✅ **Netlify CLI integrado**
- ✅ **Script de deploy disponível**
- ⚠️ **Deploy automático DESABILITADO**

## 🔧 Como Funciona

### 1. **Deploy Manual (REGRAS DO PROJETO)**

- **Método**: Via terminal do Cursor usando Netlify CLI
- **Comando**: `npm run deploy`
- **Tempo**: ~3-5 minutos

### 2. **Configurações Ativas**

- **Node.js**: v18
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Headers de Segurança**: Configurados

### 3. **Scripts Disponíveis**

```bash
# Deploy manual (SEMPRE usar este comando)
npm run deploy

# Verificar status do deploy
npm run deploy:check

# Desenvolvimento local
npm run dev
```

### 4. **Como Fazer Deploy**

1. Certifique-se de que todas as mudanças foram commitadas
2. Execute: `npm run deploy`
3. O script irá:
   - Limpar builds anteriores
   - Instalar dependências
   - Fazer build de produção
   - Fazer deploy no Netlify
   - Mostrar a URL do site

## 📋 Checklist de Deploy

### ✅ **Antes do Deploy**

- [ ] Código testado localmente
- [ ] Build funcionando (`npm run build`)
- [ ] Linting passando (`npm run lint`)
- [ ] TypeScript sem erros (`npm run type-check`)

### ✅ **Durante o Deploy**

- [ ] Build local em progresso
- [ ] Netlify deploy em progresso
- [ ] Logs sem erros

### ✅ **Após o Deploy**

- [ ] Site acessível
- [ ] Funcionalidades testadas
- [ ] Performance verificada

## 🔍 Monitoramento

### **Netlify Dashboard**

- Acesse: `https://app.netlify.com/sites/fincontrol-app`
- Verifique deploys
- Logs de build e deploy
- Status do site

## 🚨 Troubleshooting

### **Deploy Falhou**

1. Verifique logs do terminal
2. Verifique logs do Netlify Dashboard
3. Teste build local: `npm run build`
4. Corrija erros e execute `npm run deploy` novamente

### **Site Não Atualiza**

1. Aguarde 2-5 minutos
2. Limpe cache do navegador
3. Verifique se o deploy foi concluído
4. Force refresh: `Ctrl+F5`

## 📞 Suporte

- **GitHub Issues**: Para bugs e melhorias
- **Netlify Support**: Para problemas de deploy
- **Documentação**: Este arquivo

---

_Última atualização: $(date)_
