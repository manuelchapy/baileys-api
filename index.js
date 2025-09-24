// Punto de entrada para Vercel
require('dotenv').config();
const app = require('./app');
const config = require('./config/environment.config');

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor ejecutándose en ${config.api.url}`);
  console.log(`📱 Escanea el QR en ${config.api.url}/qr`);
  console.log(`🌐 También disponible en http://127.0.0.1:${PORT}`);
  console.log(`🔗 Webhook configurado: ${config.webhook.url}`);
});

module.exports = app;
