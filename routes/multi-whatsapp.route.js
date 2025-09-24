const express = require('express');
const router = express.Router();
const multiWhatsAppController = require('../controllers/multi-whatsapp.controller');

// GET /api/multi-whatsapp/status - Obtener estado de todas las instancias
router.get('/status', async (req, res) => {
  try {
    const result = multiWhatsAppController.getStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estado',
      error: error.message
    });
  }
});

// POST /api/multi-whatsapp/create-instance - Crear nueva instancia
router.post('/create-instance', async (req, res) => {
  try {
    const { clientId, phoneNumber } = req.body;
    
    if (!clientId || !phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'clientId y phoneNumber son requeridos'
      });
    }

    const result = await multiWhatsAppController.createInstance(clientId, phoneNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al crear instancia',
      error: error.message
    });
  }
});

// GET /api/multi-whatsapp/qr/:clientId - Obtener QR de una instancia específica
router.get('/qr/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = multiWhatsAppController.getQR(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener QR',
      error: error.message
    });
  }
});

// POST /api/multi-whatsapp/send-message - Enviar mensaje desde una instancia específica
router.post('/send-message', async (req, res) => {
  try {
    const { clientId, phoneNumber, message } = req.body;
    
    if (!clientId || !phoneNumber || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'clientId, phoneNumber y message son requeridos'
      });
    }

    const result = await multiWhatsAppController.sendMessage(clientId, phoneNumber, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
});

// POST /api/multi-whatsapp/reconnect/:clientId - Reconectar una instancia específica
router.post('/reconnect/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await multiWhatsAppController.reconnectInstance(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al reconectar instancia',
      error: error.message
    });
  }
});

// POST /api/multi-whatsapp/webhook - Configurar webhook
router.post('/webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'webhookUrl es requerido'
      });
    }

    const result = await multiWhatsAppController.setWebhook(webhookUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al configurar webhook',
      error: error.message
    });
  }
});

module.exports = router;
