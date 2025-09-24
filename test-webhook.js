require('dotenv').config();
const axios = require('axios');
const config = require('./config/environment.config');

// Script para probar el webhook de n8n
async function testWebhook() {
  try {
    console.log('🧪 Probando webhook de n8n...');
    console.log('🔗 URL del webhook:', config.webhook.url);
    
    const testMessage = {
      event: 'message.received',
      data: {
        id: 'test-123',
        text: 'Hola, este es un mensaje de prueba',
        sender: '584124598399@s.whatsapp.net',
        senderName: 'Usuario de Prueba',
        timestamp: Date.now(),
        isFromMe: false,
        type: 'text',
        receivedAt: new Date().toISOString()
      }
    };

    const response = await axios.post(config.webhook.url, testMessage, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ Webhook funcionando correctamente!');
    console.log('📨 Respuesta:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Error: n8n no está ejecutándose');
      console.log('💡 Asegúrate de que n8n esté corriendo y el webhook esté configurado');
    } else {
      console.log('❌ Error al probar webhook:', error.message);
    }
  }
}

// Ejecutar prueba
testWebhook();
