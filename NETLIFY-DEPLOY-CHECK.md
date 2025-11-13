# ✅ Checklist de Deploy - Telegram Bot no Netlify

Use este checklist para garantir que o bot Telegram está funcionando corretamente em produção.

## 📋 Pré-Deploy

### Variáveis de Ambiente
- [ ] `TELEGRAM_BOT_TOKEN` configurado no Netlify
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado no Netlify
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado no Netlify
- [ ] `NEXT_PUBLIC_APP_URL` configurado no Netlify (ou usando fallback)

**Como verificar:**
1. Acesse: https://app.netlify.com/sites/fincontrol-app/settings/env
2. Verifique se todas as 4 variáveis estão presentes
3. OU execute: `npm run setup:netlify` (se Netlify CLI estiver instalado)

### Webhook do Telegram
- [ ] Webhook configurado para: `https://fincontrol-app.netlify.app/api/telegram/webhook`
- [ ] Webhook antigo removido (se houver)

**Como verificar:**
```bash
npm run webhook:check
```

**Como configurar:**
```bash
npm run webhook:prod
```

### Banco de Dados
- [ ] Schema SQL executado no Supabase (`telegram-bot-setup.sql`)
- [ ] Tabelas criadas:
  - [ ] `user_telegram_links`
  - [ ] `telegram_auth_tokens`
  - [ ] `telegram_sessions`
- [ ] RLS policies configuradas

## 🚀 Deploy

### Executar Deploy
- [ ] Código commitado no Git
- [ ] Deploy executado: `npm run deploy`
- [ ] Deploy concluído com sucesso no Netlify

**Como verificar:**
1. Acesse: https://app.netlify.com/sites/fincontrol-app/deploys
2. Verifique se o último deploy está "Published"

## ✅ Pós-Deploy

### Teste do Bot

#### 1. Comando /start
- [ ] Enviar `/start` para o bot no Telegram
- [ ] Bot responde com mensagem de boas-vindas
- [ ] Se não conectado, mostra botão "Conectar Conta"
- [ ] Se conectado, mostra lista de comandos

**Comando de teste:**
```
/start
```

**Resultado esperado:**
- Mensagem de boas-vindas personalizada
- Lista de comandos disponíveis
- Botões de atalho (se conectado)

#### 2. Comando /contas
- [ ] Enviar `/contas` para o bot
- [ ] Bot lista todas as contas (próprias + compartilhadas)
- [ ] Contas compartilhadas aparecem com "(compartilhada)"

**Comando de teste:**
```
/contas
```

**Resultado esperado:**
- Lista numerada de contas
- Contas compartilhadas marcadas

#### 3. Registro de Gasto (Linguagem Natural)
- [ ] Enviar mensagem: `gasto 10 café conta role`
- [ ] Bot identifica: valor, categoria, conta
- [ ] Bot pede confirmação (se categoria não identificada, pergunta)
- [ ] Ao confirmar, transação é salva no banco
- [ ] Bot confirma com mensagem de sucesso

**Comando de teste:**
```
gasto 10 café conta role
```

**Resultado esperado:**
- Mensagem de confirmação antes de salvar
- Botões "✅ Sim" e "❌ Não"
- Após confirmar, transação aparece no sistema

#### 4. Registro de Receita
- [ ] Enviar mensagem: `receita 100 freelance conta pessoal`
- [ ] Bot identifica como receita (não despesa)
- [ ] Processo de confirmação funciona
- [ ] Transação salva corretamente

**Comando de teste:**
```
receita 100 freelance conta pessoal
```

**Resultado esperado:**
- Tipo identificado como "income"
- Confirmação e salvamento funcionando

#### 5. Comando /help
- [ ] Enviar `/help` para o bot
- [ ] Bot mostra lista completa de comandos
- [ ] Exemplos de uso são fornecidos

**Comando de teste:**
```
/help
```

**Resultado esperado:**
- Lista de todos os comandos
- Exemplos de uso

### Verificação de Logs

#### Logs no Netlify
- [ ] Acessar: https://app.netlify.com/sites/fincontrol-app/functions
- [ ] Verificar logs da função `api-telegram-webhook`
- [ ] Não há erros recorrentes
- [ ] Logs mostram mensagens sendo processadas

**O que procurar nos logs:**
- ✅ `📨 Telegram webhook received`
- ✅ `✅ Executando /start` (ou outro comando)
- ✅ `📤 Enviando para Telegram API: OK`
- ❌ NÃO deve aparecer: `❌ TELEGRAM_BOT_TOKEN não configurado`
- ❌ NÃO deve aparecer: `❌ Variáveis do Supabase não configuradas`

#### Logs no Supabase
- [ ] Verificar se transações estão sendo criadas
- [ ] Verificar se `user_telegram_links` está sendo populado
- [ ] Verificar se `telegram_sessions` está sendo usado corretamente

**Como verificar:**
1. Acesse: Supabase Dashboard → Table Editor
2. Verifique tabela `transactions` (deve ter novas entradas)
3. Verifique tabela `user_telegram_links` (deve ter seu registro)

### Teste de Funcionalidades Avançadas

#### Múltiplas Contas
- [ ] Se usuário tem múltiplas contas, bot pergunta qual usar
- [ ] Botões de seleção funcionam corretamente

#### Categoria Não Identificada
- [ ] Se categoria não identificada, bot pergunta qual usar
- [ ] Lista de categorias disponíveis é mostrada
- [ ] Seleção funciona corretamente

#### Sessão Expirada
- [ ] Aguardar 10 minutos após iniciar uma transação
- [ ] Tentar confirmar transação expirada
- [ ] Bot informa que sessão expirou

## 🔧 Troubleshooting

### Bot não responde
1. Verificar webhook: `npm run webhook:check`
2. Verificar variáveis de ambiente no Netlify
3. Verificar logs no Netlify Functions
4. Verificar se endpoint está acessível: `curl https://fincontrol-app.netlify.app/api/telegram/webhook`

### "Nenhuma conta encontrada"
1. Verificar se usuário está vinculado: `/start` deve mostrar mensagem de boas-vindas
2. Verificar se há contas criadas no sistema
3. Verificar logs para ver se `getUserAccounts` está funcionando

### Transações não são salvas
1. Verificar logs do Netlify para erros
2. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está correto
3. Verificar se RLS policies estão configuradas corretamente
4. Verificar tabela `transactions` no Supabase

### Webhook retorna 404
1. Verificar se URL do webhook está correta
2. Verificar se deploy foi concluído
3. Verificar se rota `/api/telegram/webhook` existe no código

## 📊 Critérios de Sucesso

✅ **Bot funcionando em produção quando:**
- [ ] Responde a comandos sem servidor local rodando
- [ ] Comandos `/start`, `/contas`, `/gasto`, `/receita` funcionam
- [ ] Linguagem natural funciona (`gasto 10 café conta role`)
- [ ] Dados são salvos no banco de dados
- [ ] Logs aparecem no Netlify Functions
- [ ] Não há erros recorrentes nos logs

## 📝 Notas

- ⚠️ **IMPORTANTE**: O bot só funciona em produção se o webhook estiver configurado corretamente
- ⚠️ **IMPORTANTE**: Variáveis de ambiente devem estar configuradas no Netlify (não apenas no `.env.local`)
- 💡 **DICA**: Use `npm run webhook:check` para verificar status do webhook a qualquer momento
- 💡 **DICA**: Logs do Netlify são atualizados em tempo real durante testes

