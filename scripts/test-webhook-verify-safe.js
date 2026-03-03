/**
 * Script de TESTE SEGURO para verificar a lógica de verificação de webhook
 * NÃO ALTERA NADA - apenas verifica e mostra o que seria feito
 */

const fs = require('fs');
const path = require('path');

// Carregar .env.local se existir
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fincontrol-bot.vercel.app';
const CORRECT_WEBHOOK_URL = `${APP_URL}/api/telegram/webhook`;

// URLs incorretas conhecidas que devem ser corrigidas
const INCORRECT_URL_PATTERNS = [
  'network-bots.adaptgroup.pro',
  'bots.cdn-global.pro',
  'fincontrol.netlify.app', // URL antiga sem -app
];

async function testWebhookVerification() {
  console.log('🧪 TESTE SEGURO - Verificação de Webhook\n');
  console.log('=' .repeat(60));
  console.log('⚠️  MODO TESTE: Nenhuma alteração será feita!');
  console.log('=' .repeat(60));
  console.log('');

  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado!');
    console.error('💡 Configure no .env.local ou como variável de ambiente');
    process.exit(1);
  }

  console.log('📋 Configuração:');
  console.log(`   Token: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}`);
  console.log(`   URL da aplicação: ${APP_URL}`);
  console.log(`   URL esperada do webhook: ${CORRECT_WEBHOOK_URL}`);
  console.log('');

  try {
    // 1. Verificar webhook atual
    console.log('1️⃣ Verificando webhook atual...');
    const checkResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const checkData = await checkResponse.json();

    if (!checkData.ok) {
      console.error('❌ Erro ao verificar webhook:', checkData.description);
      process.exit(1);
    }

    const currentUrl = checkData.result.url || '';
    console.log(`   ✅ Webhook atual: ${currentUrl || '(não configurado)'}`);
    console.log(`   ✅ URL esperada: ${CORRECT_WEBHOOK_URL}`);
    console.log('');

    // 2. Verificar se está correto
    const isCorrect = currentUrl === CORRECT_WEBHOOK_URL;
    console.log('2️⃣ Análise:');
    
    if (isCorrect) {
      console.log('   ✅ Webhook está CORRETO!');
      console.log('   📊 Status:');
      console.log(`      - Pendentes: ${checkData.result.pending_update_count || 0}`);
      
      if (checkData.result.last_error_message) {
        console.log(`      - ⚠️  Último erro: ${checkData.result.last_error_message}`);
        const errorDate = checkData.result.last_error_date 
          ? new Date(checkData.result.last_error_date * 1000).toLocaleString('pt-BR')
          : 'N/A';
        console.log(`      - Data do erro: ${errorDate}`);
      } else {
        console.log('      - ✅ Sem erros recentes');
      }
      
      console.log('');
      console.log('🎉 RESULTADO: Webhook está correto, nenhuma ação necessária!');
      return;
    }

    // 3. Verificar se é uma URL incorreta conhecida
    const isIncorrectUrl = INCORRECT_URL_PATTERNS.some(pattern => 
      currentUrl.includes(pattern)
    );

    console.log(`   ${isCorrect ? '✅' : '❌'} Webhook está ${isCorrect ? 'CORRETO' : 'INCORRETO'}`);
    
    if (isIncorrectUrl) {
      console.log(`   ⚠️  URL incorreta detectada (padrão conhecido)`);
      const matchedPattern = INCORRECT_URL_PATTERNS.find(pattern => 
        currentUrl.includes(pattern)
      );
      console.log(`   📍 Padrão detectado: ${matchedPattern}`);
    } else if (currentUrl && currentUrl !== CORRECT_WEBHOOK_URL) {
      console.log(`   ⚠️  URL diferente da esperada`);
    }

    console.log('');
    console.log('3️⃣ O que seria feito (SIMULAÇÃO):');
    
    if (!isCorrect || isIncorrectUrl) {
      console.log('   🔧 Ação: Corrigir webhook');
      console.log(`   📤 De: ${currentUrl || '(não configurado)'}`);
      console.log(`   📥 Para: ${CORRECT_WEBHOOK_URL}`);
      console.log('   ⚙️  Parâmetros: drop_pending_updates=true');
      console.log('');
      console.log('   ⚠️  ATENÇÃO: Em produção, isso alteraria o webhook!');
    } else {
      console.log('   ✅ Nenhuma ação necessária');
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ TESTE CONCLUÍDO - Nenhuma alteração foi feita');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testWebhookVerification();
