// Script para verificar configuración de Twilio
// Ejecutar con: node verify-twilio.js

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

console.log('\n🔍 Verificando configuración de Twilio...\n');

const accountSid = envVars.TWILIO_ACCOUNT_SID;
const authToken = envVars.TWILIO_AUTH_TOKEN;
const phoneNumber = envVars.TWILIO_PHONE_NUMBER;
const whatsappNumber = envVars.TWILIO_WHATSAPP_NUMBER;

console.log('📋 Variables de entorno:');
console.log('  TWILIO_ACCOUNT_SID:', accountSid ? `✅ ${accountSid.substring(0, 8)}...` : '❌ NO CONFIGURADO');
console.log('  TWILIO_AUTH_TOKEN:', authToken ? `✅ ${authToken.substring(0, 8)}...` : '❌ NO CONFIGURADO');
console.log('  TWILIO_PHONE_NUMBER:', phoneNumber ? `✅ ${phoneNumber}` : '⚠️ Vacío (OK para WhatsApp)');
console.log('  TWILIO_WHATSAPP_NUMBER:', whatsappNumber ? `✅ ${whatsappNumber}` : '❌ NO CONFIGURADO');

console.log('\n📊 Estado de configuración:');

if (!accountSid || !authToken) {
  console.log('❌ FALTA ACCOUNT_SID o AUTH_TOKEN');
  console.log('   Obtener de: https://console.twilio.com');
  process.exit(1);
}

if (!whatsappNumber) {
  console.log('❌ FALTA WHATSAPP_NUMBER');
  console.log('   Debe ser: whatsapp:+14155238886');
  process.exit(1);
}

if (!whatsappNumber.startsWith('whatsapp:')) {
  console.log('⚠️ WHATSAPP_NUMBER debe empezar con "whatsapp:"');
  console.log(`   Actual: ${whatsappNumber}`);
  console.log('   Debe ser: whatsapp:+14155238886');
  process.exit(1);
}

console.log('✅ CONFIGURACIÓN CORRECTA');
console.log('\n📱 Próximos pasos:');
console.log('1. Unirse al WhatsApp Sandbox');
console.log('2. Reiniciar servidor: npm run dev');
console.log('3. Crear reserva de prueba');
console.log('\n✨ ¡Listo para enviar WhatsApp!\n');
