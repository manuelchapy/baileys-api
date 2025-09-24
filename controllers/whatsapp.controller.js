const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const config = require('../config/environment.config');

class WhatsAppController {
  constructor() {
    this.socket = null;
    this.qrCode = null;
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.authDir = path.join(__dirname, '..', 'auth_info');
    this.logger = pino({ level: 'info' });
    this.webhookUrl = config.webhook.url; // URL del webhook desde configuración
    this.welcomeMessageSent = false; // Controlar si ya se envió el mensaje de bienvenida
  }

  async connect() {
    try {
      // Crear directorio de autenticación si no existe
      await fs.ensureDir(this.authDir);

      // Configurar estado de autenticación
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      // Crear socket de WhatsApp con configuración básica
      this.socket = makeWASocket({
        auth: state,
        logger: this.logger,
        browser: config.baileys.browser,
        ...config.baileys.basic
      });

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('🔄 Estado de conexión:', connection);
        
        if (qr) {
          this.qrCode = qr;
          console.log('📱 Código QR generado');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          console.log('❌ Conexión cerrada. Razón:', lastDisconnect?.error?.message || 'Desconocida');
          console.log('🔄 Debe reconectar:', shouldReconnect);
          
          // Si hay error de conexión, limpiar sesión y reiniciar
          if (lastDisconnect?.error?.message === 'Connection Failure') {
            console.log('🧹 Error de conexión detectado. Limpiando sesión...');
            this.clearSession().then(() => {
              console.log('🔄 Reiniciando conexión después de limpiar sesión...');
              setTimeout(() => {
                this.connect();
              }, 3000);
            }).catch((clearError) => {
              console.error('Error al limpiar sesión:', clearError);
              console.log('🔄 Intentando reconectar sin limpiar sesión...');
              setTimeout(() => {
                this.connect();
              }, 5000);
            });
          } else if (shouldReconnect) {
            console.log('🔄 Reconectando en 5 segundos...');
            setTimeout(() => {
              this.connect();
            }, 5000);
          } else {
            console.log('❌ Conexión cerrada. Debes escanear el QR nuevamente.');
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp conectado exitosamente');
          this.isConnected = true;
          this.connectionStatus = 'connected';
          this.qrCode = null;
          
          // Enviar mensaje de bienvenida solo si no se ha enviado antes
          if (!this.welcomeMessageSent) {
            this.sendWelcomeMessage();
            this.welcomeMessageSent = true;
          }
          
          // Configurar webhook automáticamente
          if (this.webhookUrl) {
            console.log('🔗 Webhook configurado automáticamente:', this.webhookUrl);
          }
        } else if (connection === 'connecting') {
          console.log('🔄 Conectando a WhatsApp...');
          this.connectionStatus = 'connecting';
        } else if (connection === 'open' && update.qr) {
          console.log('📱 Código QR generado después de reconexión');
          this.qrCode = update.qr;
        }
      });

      // Guardar credenciales cuando se actualicen
      this.socket.ev.on('creds.update', saveCreds);

      // Manejar eventos de credenciales
      this.socket.ev.on('creds.update', () => {
        console.log('💾 Credenciales actualizadas y guardadas');
      });

      // Manejar mensajes entrantes
      this.socket.ev.on('messages.upsert', (m) => {
        console.log('📨 Mensaje recibido:', m);
        
        // Procesar mensajes y enviar webhook si está configurado
        this.processIncomingMessage(m);
      });

      return {
        status: 'success',
        message: 'Iniciando conexión con WhatsApp',
        connectionStatus: this.connectionStatus
      };

    } catch (error) {
      console.error('Error al conectar:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.socket) {
        // Verificar si la conexión está activa antes de hacer logout
        if (this.socket.user && this.isConnected) {
          try {
            await this.socket.logout();
          } catch (logoutError) {
            console.log('⚠️ No se pudo hacer logout (conexión ya cerrada):', logoutError.message);
          }
        }
        this.socket = null;
      }
      
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar

      return {
        status: 'success',
        message: 'Desconectado de WhatsApp exitosamente',
        connectionStatus: this.connectionStatus
      };

    } catch (error) {
      console.error('Error al desconectar:', error);
      // No lanzar el error, solo limpiar el estado
      this.socket = null;
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar
      
      return {
        status: 'success',
        message: 'Desconectado de WhatsApp (conexión ya cerrada)',
        connectionStatus: this.connectionStatus
      };
    }
  }

  async clearSession() {
    try {
      // Limpiar estado sin intentar logout
      this.socket = null;
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar
      
      // Limpiar archivos de autenticación
      if (await fs.pathExists(this.authDir)) {
        await fs.remove(this.authDir);
        console.log('🗑️ Sesión anterior eliminada');
      }
      
      return {
        status: 'success',
        message: 'Sesión limpiada exitosamente. Reinicia la conexión.',
        connectionStatus: 'disconnected'
      };

    } catch (error) {
      console.error('Error al limpiar sesión:', error);
      // Limpiar archivos de autenticación incluso si hay error
      try {
        if (await fs.pathExists(this.authDir)) {
          await fs.remove(this.authDir);
          console.log('🗑️ Sesión anterior eliminada (después de error)');
        }
      } catch (cleanupError) {
        console.error('Error al limpiar archivos:', cleanupError);
      }
      
      // Limpiar estado de todas formas
      this.socket = null;
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar
      
      return {
        status: 'success',
        message: 'Sesión limpiada exitosamente (con errores menores). Reinicia la conexión.',
        connectionStatus: 'disconnected'
      };
    }
  }

  async restart() {
    try {
      console.log('🔄 Reiniciando conexión...');
      
      // Limpiar sesión actual
      await this.clearSession();
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reconectar
      const result = await this.connect();
      
      return {
        status: 'success',
        message: 'Conexión reiniciada exitosamente',
        connectionStatus: this.connectionStatus
      };

    } catch (error) {
      console.error('Error al reiniciar:', error);
      throw error;
    }
  }

  async connectWithRetry() {
    try {
      // Crear directorio de autenticación si no existe
      await fs.ensureDir(this.authDir);

      // Configurar estado de autenticación
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      // Crear socket de WhatsApp con configuración de reconexión
        this.socket = makeWASocket({
          auth: state,
          logger: this.logger,
          browser: config.baileys.browser,
          ...config.baileys.reconnect
        });

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('🔄 Estado de conexión (retry):', connection);
        
        if (qr) {
          this.qrCode = qr;
          console.log('📱 Código QR generado (retry)');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          console.log('❌ Conexión cerrada (retry). Razón:', lastDisconnect?.error?.message || 'Desconocida');
          
          if (shouldReconnect) {
            console.log('🔄 Reconectando en 10 segundos...');
            setTimeout(() => {
              this.connectWithRetry();
            }, 10000);
          } else {
            console.log('❌ Conexión cerrada definitivamente.');
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.welcomeMessageSent = false; // Resetear flag al desconectar
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp conectado exitosamente (retry)');
          this.isConnected = true;
          this.connectionStatus = 'connected';
          this.qrCode = null;
        }
      });

      // Guardar credenciales cuando se actualicen
      this.socket.ev.on('creds.update', saveCreds);

      return {
        status: 'success',
        message: 'Iniciando conexión con retry',
        connectionStatus: this.connectionStatus
      };

    } catch (error) {
      console.error('Error al conectar con retry:', error);
      throw error;
    }
  }

  async getQR() {
    try {
      if (!this.qrCode) {
        return {
          status: 'error',
          message: 'No hay código QR disponible. Inicia la conexión primero.',
          qr: null
        };
      }

      // Generar QR como imagen base64
      const qrImage = await QRCode.toDataURL(this.qrCode);
      
      return {
        status: 'success',
        message: 'Código QR generado exitosamente',
        qr: qrImage,
        connectionStatus: this.connectionStatus
      };

    } catch (error) {
      console.error('Error al generar QR:', error);
      throw error;
    }
  }

  async getStatus() {
    return {
      status: 'success',
      message: 'Estado de la conexión',
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus,
      hasQR: !!this.qrCode,
      timestamp: new Date().toISOString()
    };
  }

  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isConnected || !this.socket) {
        throw new Error('WhatsApp no está conectado');
      }

      // Formatear número de teléfono
      const formattedNumber = phoneNumber.includes('@s.whatsapp.net') 
        ? phoneNumber 
        : `${phoneNumber}@s.whatsapp.net`;

      // Enviar mensaje
      await this.socket.sendMessage(formattedNumber, { text: message });

      return {
        status: 'success',
        message: 'Mensaje enviado exitosamente',
        to: formattedNumber,
        content: message,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  async getContacts() {
    try {
      if (!this.isConnected || !this.socket) {
        throw new Error('WhatsApp no está conectado');
      }

      const contacts = await this.socket.getContacts();
      
      return {
        status: 'success',
        message: 'Contactos obtenidos exitosamente',
        contacts: contacts,
        count: contacts.length
      };

    } catch (error) {
      console.error('Error al obtener contactos:', error);
      throw error;
    }
  }

  async sendWelcomeMessage() {
    try {
      if (!this.isConnected || !this.socket) {
        console.log('⚠️ No se puede enviar mensaje de bienvenida: WhatsApp no conectado');
        return;
      }

      // Obtener información del usuario conectado
      const userInfo = this.socket.user;
      const phoneNumber = userInfo?.id?.split(':')[0] || 'tu número';
      
      const welcomeMessage = `🚀 *¡API de WhatsApp Conectada!*

✅ *Estado:* Conectado exitosamente
📱 *Dispositivo:* Baileys API
🕐 *Hora:* ${new Date().toLocaleString('es-ES')}
🌐 *Servidor:* ${config.api.url}

*Endpoints disponibles:*
• GET /api/whatsapp/status
• POST /api/whatsapp/send-message
• GET /api/whatsapp/contacts
• POST /api/whatsapp/disconnect

*¡Tu API está lista para usar!* 🎉

---
*Mensaje automático de la API de Baileys*`;

      // Enviar mensaje a tu propio número
      await this.socket.sendMessage(`${phoneNumber}@s.whatsapp.net`, { 
        text: welcomeMessage 
      });

      console.log('📨 Mensaje de bienvenida enviado exitosamente');
      
      return {
        status: 'success',
        message: 'Mensaje de bienvenida enviado',
        phoneNumber: phoneNumber
      };

    } catch (error) {
      console.error('Error al enviar mensaje de bienvenida:', error);
      // No lanzar error, solo loggear
    }
  }

  async setWebhook(webhookUrl) {
    this.webhookUrl = webhookUrl;
    console.log('🔗 Webhook configurado:', webhookUrl);
    return {
      status: 'success',
      message: 'Webhook configurado exitosamente',
      webhookUrl: webhookUrl
    };
  }

  async processIncomingMessage(messageData) {
    try {
      console.log('🔍 Debug - Iniciando procesamiento de mensaje');
      console.log('🔍 Debug - messageData:', JSON.stringify(messageData, null, 2));
      
      if (!messageData.messages || messageData.messages.length === 0) {
        console.log('🔍 Debug - No hay mensajes para procesar');
        return;
      }

      console.log('🔍 Debug - Procesando', messageData.messages.length, 'mensajes');

      for (const message of messageData.messages) {
        console.log('🔍 Debug - Procesando mensaje individual:', JSON.stringify(message, null, 2));
        
        // Solo procesar mensajes de texto
        if (message.message?.conversation || message.message?.extendedTextMessage?.text) {
          const messageText = message.message.conversation || message.message.extendedTextMessage?.text;
          
          // Extraer el número real del remitente
          let sender = message.key.remoteJid;
          let senderName = message.pushName || 'Usuario';
          
          // Si es un mensaje de grupo, usar el participante real
          if (message.key.participant) {
            sender = message.key.participant;
            // Extraer solo el número del participante (remover @lid)
            const participantNumber = message.key.participant.split('@')[0];
            sender = `${participantNumber}@s.whatsapp.net`;
          }
          
          const timestamp = message.messageTimestamp;
          const isFromMe = message.key.fromMe;

          console.log('🔍 Debug - Mensaje de texto detectado:');
          console.log('🔍 Debug - Texto:', messageText);
          console.log('🔍 Debug - Remitente:', sender);
          console.log('🔍 Debug - Nombre:', senderName);
          console.log('🔍 Debug - Es de mí:', isFromMe);

          // No procesar mensajes de la API misma
          if (!isFromMe) { // Solo procesar mensajes que NO sean de la API
            const messageInfo = {
              id: message.key.id,
              text: messageText,
              sender: sender,
              senderName: senderName,
              timestamp: timestamp,
              isFromMe: isFromMe,
              type: 'text',
              receivedAt: new Date().toISOString()
            };

            console.log('📨 Procesando mensaje:', messageInfo);

            // Enviar webhook si está configurado
            if (this.webhookUrl) {
              console.log('🔍 Debug - Enviando webhook a:', this.webhookUrl);
              await this.sendWebhook(messageInfo);
            } else {
              console.log('🔍 Debug - No hay webhook configurado');
            }
          } else {
            console.log('🔍 Debug - Mensaje ignorado porque es de la API misma');
          }
        } else {
          console.log('🔍 Debug - Mensaje no es de texto, ignorando');
        }
      }
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
    }
  }

  async sendWebhook(messageData) {
    try {
      const axios = require('axios');
      
      console.log('🔍 Debug - Enviando webhook a:', this.webhookUrl);
      console.log('🔍 Debug - Datos del webhook:', JSON.stringify({
        event: 'message.received',
        data: messageData
      }, null, 2));
      
      const response = await axios.post(this.webhookUrl, {
        event: 'message.received',
        data: messageData
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Baileys-API/1.0.0'
        }
      });

      console.log('🔗 Webhook enviado exitosamente');
      console.log('🔍 Debug - Respuesta del webhook:', response.status, response.data);
    } catch (error) {
      console.error('Error al enviar webhook:', error.message);
      if (error.response) {
        console.error('🔍 Debug - Status del error:', error.response.status);
        console.error('🔍 Debug - Datos del error:', error.response.data);
        console.error('🔍 Debug - Headers del error:', error.response.headers);
      }
    }
  }
}

module.exports = new WhatsAppController();
