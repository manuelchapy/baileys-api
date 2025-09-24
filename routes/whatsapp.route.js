const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');
const config = require('../config/environment.config');

const router = express.Router();

// POST /api/whatsapp/connect - Iniciar conexión con WhatsApp
router.post('/connect', async (req, res) => {
  try {
    const result = await whatsappController.connect();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con WhatsApp',
      error: error.message
    });
  }
});

// POST /api/whatsapp/disconnect - Desconectar de WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    const result = await whatsappController.disconnect();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al desconectar de WhatsApp',
      error: error.message
    });
  }
});

// POST /api/whatsapp/clear-session - Limpiar sesión y reiniciar
router.post('/clear-session', async (req, res) => {
  try {
    const result = await whatsappController.clearSession();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al limpiar sesión',
      error: error.message
    });
  }
});

// POST /api/whatsapp/restart - Reiniciar conexión completamente
router.post('/restart', async (req, res) => {
  try {
    const result = await whatsappController.restart();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al reiniciar conexión',
      error: error.message
    });
  }
});

// POST /api/whatsapp/connect-retry - Conectar con configuración de retry
router.post('/connect-retry', async (req, res) => {
  try {
    const result = await whatsappController.connectWithRetry();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con retry',
      error: error.message
    });
  }
});

// GET /api/whatsapp/qr - Obtener código QR
router.get('/qr', async (req, res) => {
  try {
    const result = await whatsappController.getQR();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener código QR',
      error: error.message
    });
  }
});

// GET /api/whatsapp/status - Obtener estado de la conexión
router.get('/status', async (req, res) => {
  try {
    const result = await whatsappController.getStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estado',
      error: error.message
    });
  }
});

// POST /api/whatsapp/send-message - Enviar mensaje
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'phoneNumber y message son requeridos'
      });
    }

    const result = await whatsappController.sendMessage(phoneNumber, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
});

// GET /api/whatsapp/contacts - Obtener contactos
router.get('/contacts', async (req, res) => {
  try {
    const result = await whatsappController.getContacts();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener contactos',
      error: error.message
    });
  }
});

// POST /api/whatsapp/welcome - Enviar mensaje de bienvenida
router.post('/welcome', async (req, res) => {
  try {
    const result = await whatsappController.sendWelcomeMessage();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar mensaje de bienvenida',
      error: error.message
    });
  }
});

// POST /api/whatsapp/webhook - Configurar webhook para mensajes entrantes
router.post('/webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'webhookUrl es requerido'
      });
    }

    const result = await whatsappController.setWebhook(webhookUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al configurar webhook',
      error: error.message
    });
  }
});

// POST /api/whatsapp/test-webhook - Probar webhook con datos de ejemplo
router.post('/test-webhook', async (req, res) => {
  try {
    const testMessage = {
      id: 'TEST_MESSAGE_ID',
      text: 'Mensaje de prueba desde la API',
      sender: '584247713952@s.whatsapp.net',
      senderName: 'Usuario de Prueba',
      timestamp: Math.floor(Date.now() / 1000),
      isFromMe: false,
      type: 'text',
      receivedAt: new Date().toISOString()
    };

    await whatsappController.sendWebhook(testMessage);
    
    res.json({
      status: 'success',
      message: 'Webhook de prueba enviado exitosamente',
      testData: testMessage
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar webhook de prueba',
      error: error.message
    });
  }
});

// POST /api/whatsapp/test-audio-webhook - Probar webhook con audio de ejemplo
router.post('/test-audio-webhook', async (req, res) => {
  try {
    const testAudioMessage = {
      id: 'TEST_AUDIO_MESSAGE_ID',
      text: '[Nota de voz]',
      sender: '584247713952@s.whatsapp.net',
      senderName: 'Usuario de Prueba',
      timestamp: Math.floor(Date.now() / 1000),
      isFromMe: false,
      type: 'audio',
      receivedAt: new Date().toISOString(),
      media: {
        type: 'audio',
        data: 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTgwOUarm7blmGgE=',
        mimeType: 'audio/ogg',
        fileName: 'test_audio.ogg',
        fileSize: 1024,
        duration: 5,
        isVoiceNote: true,
        base64Length: 1368
      }
    };

    await whatsappController.sendWebhook(testAudioMessage);
    
    res.json({
      status: 'success',
      message: 'Webhook de audio de prueba enviado exitosamente',
      testData: testAudioMessage
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar webhook de audio de prueba',
      error: error.message
    });
  }
});

module.exports = router;
