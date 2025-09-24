const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas
const whatsappRoutes = require('./routes/whatsapp.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/whatsapp', whatsappRoutes);

// Ruta principal para mostrar QR
app.get('/', (req, res) => {
  res.redirect('/qr');
});

app.get('/qr', (req, res) => {
  const config = require('./config/environment.config');
  res.render('qr', { 
    title: 'WhatsApp QR - Baileys API',
    message: 'Escanea el código QR con tu WhatsApp para vincular el dispositivo',
    webhookUrl: config.webhook.url,
    apiUrl: config.api.url
  });
});

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Baileys API funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: {
      qr: '/qr',
      status: '/api/status',
      whatsapp: {
        connect: 'POST /api/whatsapp/connect',
        disconnect: 'POST /api/whatsapp/disconnect',
        sendMessage: 'POST /api/whatsapp/send-message',
        getQR: 'GET /api/whatsapp/qr',
        getStatus: 'GET /api/whatsapp/status'
      }
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  // No cerrar la aplicación, solo loggear el error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // No cerrar la aplicación, solo loggear el error
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    availableRoutes: [
      'GET /',
      'GET /qr',
      'GET /api/status',
      'POST /api/whatsapp/connect',
      'POST /api/whatsapp/disconnect',
      'GET /api/whatsapp/qr',
      'GET /api/whatsapp/status',
      'POST /api/whatsapp/send-message'
    ]
  });
});

module.exports = app;
