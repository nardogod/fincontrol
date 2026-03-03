/**
 * Script para inicializar/verificar webhook após deploy
 * Chama a API de inicialização do webhook
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fincontrol-bot.vercel.app';
const VERIFY_SECRET = process.env.WEBHOOK_VERIFY_SECRET || 'default-secret-change-me';
const FORCE = process.argv.includes('--force');

async function initWebhook() {
  console.log('🔧 Inicializando webhook após deploy...\n');
  
  const url = `${APP_URL}/api/telegram/init-webhook?secret=${VERIFY_SECRET}${FORCE ? '&force=true' : ''}`;
  
  console.log(`📍 URL: ${APP_URL}`);
  console.log(`🔐 Secret: ${VERIFY_SECRET.substring(0, 10)}...`);
  console.log(`🔄 Force: ${FORCE ? 'Sim' : 'Não'}\n`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.ok) {
      console.log('✅ Webhook inicializado com sucesso!');
      console.log(`   Mensagem: ${data.message}`);
      console.log(`   Timestamp: ${data.timestamp}`);
    } else {
      console.error('❌ Erro ao inicializar webhook:');
      console.error(`   Erro: ${data.error || 'Desconhecido'}`);
      console.error(`   Mensagem: ${data.message || 'N/A'}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error.message);
    process.exit(1);
  }
}

initWebhook();
