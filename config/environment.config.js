require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // URLs de la API
  api: {
    url: process.env.API_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://content-charisma-production.up.railway.app' 
      : 'http://localhost:3000')
  },

  // URLs del webhook
  webhook: {
    url: process.env.WEBHOOK_URL || (process.env.NODE_ENV === 'production'
      ? 'https://tu-n8n.vercel.app/webhook-test/whatsapp'
      : 'http://localhost:5678/webhook-test/whatsapp')
  },

  // Configuración de Baileys
  baileys: {
    browser: ['Baileys API', 'Chrome', '1.0.0'],
    basic: {
      printQRInTerminal: false,
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 10_000,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 3,
      defaultQueryTimeoutMs: 60_000,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false
    },
    reconnect: {
      printQRInTerminal: false,
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
      retryRequestDelayMs: 500,
      maxMsgRetryCount: 5,
      defaultQueryTimeoutMs: 0,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true
    }
  }
};

module.exports = config;
