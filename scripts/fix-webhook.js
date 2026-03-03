const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8401908085:AAEepDEQz3v--gA0mpXJYiEOuTquA63P1Zw';
const WEBHOOK_URL = 'https://fincontrol-bot.vercel.app/api/telegram/webhook';

async function fixWebhook() {
  console.log('🔧 Corrigindo webhook do Telegram...\n');
  
  // 1. Verificar webhook atual
  console.log('1️⃣ Verificando webhook atual...');
  try {
    const checkResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const checkData = await checkResponse.json();
    
    console.log(`   URL atual: ${checkData.result.url}`);
    console.log(`   URL esperada: ${WEBHOOK_URL}`);
    
    if (checkData.result.url === WEBHOOK_URL) {
      console.log('   ✅ Webhook já está correto!');
      return;
    }
    
    console.log('   ⚠️ Webhook está apontando para URL incorreta!\n');
  } catch (error) {
    console.error('   ❌ Erro ao verificar webhook:', error.message);
  }
  
  // 2. Configurar webhook correto
  console.log('2️⃣ Configurando webhook correto...');
  try {
    const setResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}&drop_pending_updates=true`
    );
    const setData = await setResponse.json();
    
    if (setData.ok) {
      console.log('   ✅ Webhook configurado com sucesso!');
      console.log(`   URL: ${WEBHOOK_URL}`);
    } else {
      console.error('   ❌ Erro ao configurar webhook:', setData.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Erro ao configurar webhook:', error.message);
    process.exit(1);
  }
  
  // 3. Verificar novamente
  console.log('\n3️⃣ Verificando webhook após correção...');
  try {
    const verifyResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.result.url === WEBHOOK_URL) {
      console.log('   ✅ Webhook confirmado!');
      console.log(`   URL: ${verifyData.result.url}`);
      console.log(`   Pendentes: ${verifyData.result.pending_update_count}`);
      
      if (verifyData.result.last_error_message) {
        console.log(`   ⚠️ Último erro: ${verifyData.result.last_error_message}`);
      } else {
        console.log('   ✅ Sem erros recentes');
      }
    } else {
      console.error('   ❌ Webhook ainda está incorreto!');
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Erro ao verificar webhook:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 Webhook corrigido com sucesso!');
  console.log('📱 Teste o bot enviando /start no Telegram');
}

fixWebhook().catch(console.error);
