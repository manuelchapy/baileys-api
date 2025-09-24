const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const axios = require('axios');
const config = require('../config/baileys.config');

class MultiWhatsAppController {
  constructor() {
    this.instances = new Map(); // Almacenar múltiples instancias
    this.webhookUrl = 'http://localhost:5678/webhook-test/whatsapp';
    this.logger = pino({ level: 'info' });
  }

  // Crear una nueva instancia para un cliente
  async createInstance(clientId, phoneNumber) {
    try {
      const authDir = path.join(__dirname, '..', 'auth_info', clientId);
      await fs.ensureDir(authDir);

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const socket = makeWASocket({
        auth: state,
        logger: this.logger,
        browser: config.browser,
        ...config.basic
      });

      const instance = {
        id: clientId,
        phoneNumber: phoneNumber,
        socket: socket,
        isConnected: false,
        connectionStatus: 'disconnected',
        qrCode: null,
        authDir: authDir
      };

      // Configurar eventos
      this.setupInstanceEvents(instance);

      this.instances.set(clientId, instance);
      
      return {
        status: 'success',
        message: `Instancia creada para cliente ${clientId}`,
        clientId: clientId,
        phoneNumber: phoneNumber
      };

    } catch (error) {
      console.error('Error al crear instancia:', error);
      throw error;
    }
  }

  // Configurar eventos para una instancia
  setupInstanceEvents(instance) {
    const { socket, id } = instance;

    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`🔄 [${id}] Estado de conexión:`, connection);
      
      if (qr) {
        instance.qrCode = qr;
        console.log(`📱 [${id}] Código QR generado`);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(`❌ [${id}] Conexión cerrada. Razón:`, lastDisconnect?.error?.message || 'Desconocida');
        
        if (shouldReconnect) {
          console.log(`🔄 [${id}] Reconectando en 5 segundos...`);
          setTimeout(() => {
            this.reconnectInstance(id);
          }, 5000);
        } else {
          console.log(`❌ [${id}] Conexión cerrada. Debes escanear el QR nuevamente.`);
          instance.isConnected = false;
          instance.connectionStatus = 'disconnected';
          instance.qrCode = null;
        }
      } else if (connection === 'open') {
        console.log(`✅ [${id}] WhatsApp conectado exitosamente`);
        instance.isConnected = true;
        instance.connectionStatus = 'connected';
        instance.qrCode = null;
        
        this.sendWelcomeMessage(instance);
      } else if (connection === 'connecting') {
        console.log(`🔄 [${id}] Conectando a WhatsApp...`);
        instance.connectionStatus = 'connecting';
      }
    });

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('creds.update', () => {
      console.log(`💾 [${id}] Credenciales actualizadas y guardadas`);
    });

    // Manejar mensajes entrantes
    socket.ev.on('messages.upsert', (m) => {
      console.log(`📨 [${id}] Mensaje recibido:`, m);
      this.processIncomingMessage(instance, m);
    });
  }

  // Procesar mensajes entrantes
  async processIncomingMessage(instance, messageData) {
    try {
      if (!messageData.messages || messageData.messages.length === 0) {
        return;
      }

      for (const message of messageData.messages) {
        if (message.message?.conversation || message.message?.extendedTextMessage?.text) {
          const messageText = message.message.conversation || message.message.extendedTextMessage?.text;
          const sender = message.key.remoteJid;
          const senderName = message.pushName || 'Usuario';
          const timestamp = message.messageTimestamp;
          const isFromMe = message.key.fromMe;

          // Solo procesar mensajes que NO sean de la instancia misma
          if (!isFromMe) {
            const messageInfo = {
              id: message.key.id,
              text: messageText,
              sender: sender,
              senderName: senderName,
              timestamp: timestamp,
              isFromMe: isFromMe,
              type: 'text',
              receivedAt: new Date().toISOString(),
              clientId: instance.id,
              phoneNumber: instance.phoneNumber
            };

            console.log(`📨 [${instance.id}] Procesando mensaje:`, messageInfo);

            // Enviar webhook si está configurado
            if (this.webhookUrl) {
              await this.sendWebhook(messageInfo);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error al procesar mensaje en ${instance.id}:`, error);
    }
  }

  // Enviar webhook
  async sendWebhook(messageData) {
    try {
      await axios.post(this.webhookUrl, {
        event: 'message.received',
        data: messageData
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔗 Webhook enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar webhook:', error.message);
    }
  }

  // Enviar mensaje desde una instancia específica
  async sendMessage(clientId, phoneNumber, message) {
    try {
      const instance = this.instances.get(clientId);
      
      if (!instance) {
        throw new Error(`Instancia ${clientId} no encontrada`);
      }

      if (!instance.isConnected || !instance.socket) {
        throw new Error(`Instancia ${clientId} no está conectada`);
      }

      const formattedNumber = phoneNumber.includes('@s.whatsapp.net') 
        ? phoneNumber 
        : `${phoneNumber}@s.whatsapp.net`;

      await instance.socket.sendMessage(formattedNumber, { text: message });

      return {
        status: 'success',
        message: 'Mensaje enviado exitosamente',
        clientId: clientId,
        to: formattedNumber,
        content: message,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error al enviar mensaje desde ${clientId}:`, error);
      throw error;
    }
  }

  // Enviar mensaje de bienvenida
  async sendWelcomeMessage(instance) {
    try {
      if (!instance.isConnected || !instance.socket) {
        return;
      }

      const userInfo = instance.socket.user;
      const phoneNumber = userInfo?.id?.split(':')[0] || 'tu número';
      
      const welcomeMessage = `🚀 *¡API de WhatsApp Conectada!*

✅ *Estado:* Conectado exitosamente
📱 *Cliente:* ${instance.id}
🕐 *Hora:* ${new Date().toLocaleString('es-ES')}
🌐 *Servidor:* localhost:3000

*¡Tu API está lista para usar!* 🎉

---
*Mensaje automático de la API de Baileys*`;

      await instance.socket.sendMessage(`${phoneNumber}@s.whatsapp.net`, { 
        text: welcomeMessage 
      });

      console.log(`📨 [${instance.id}] Mensaje de bienvenida enviado exitosamente`);
      
    } catch (error) {
      console.error(`Error al enviar mensaje de bienvenida en ${instance.id}:`, error);
    }
  }

  // Obtener estado de todas las instancias
  getStatus() {
    const instances = [];
    
    for (const [id, instance] of this.instances) {
      instances.push({
        clientId: id,
        phoneNumber: instance.phoneNumber,
        isConnected: instance.isConnected,
        connectionStatus: instance.connectionStatus,
        hasQR: !!instance.qrCode
      });
    }

    return {
      status: 'success',
      message: 'Estado de todas las instancias',
      instances: instances,
      totalInstances: instances.length,
      timestamp: new Date().toISOString()
    };
  }

  // Obtener QR de una instancia específica
  getQR(clientId) {
    const instance = this.instances.get(clientId);
    
    if (!instance) {
      throw new Error(`Instancia ${clientId} no encontrada`);
    }

    return {
      status: 'success',
      message: 'Código QR obtenido',
      clientId: clientId,
      qrCode: instance.qrCode,
      isConnected: instance.isConnected,
      connectionStatus: instance.connectionStatus
    };
  }

  // Reconectar una instancia
  async reconnectInstance(clientId) {
    const instance = this.instances.get(clientId);
    
    if (!instance) {
      throw new Error(`Instancia ${clientId} no encontrada`);
    }

    try {
      await this.createInstance(clientId, instance.phoneNumber);
      return {
        status: 'success',
        message: `Instancia ${clientId} reconectada exitosamente`
      };
    } catch (error) {
      console.error(`Error al reconectar instancia ${clientId}:`, error);
      throw error;
    }
  }

  // Configurar webhook
  async setWebhook(webhookUrl) {
    this.webhookUrl = webhookUrl;
    console.log('🔗 Webhook configurado:', webhookUrl);
    return {
      status: 'success',
      message: 'Webhook configurado exitosamente',
      webhookUrl: webhookUrl
    };
  }
}

module.exports = new MultiWhatsAppController();
