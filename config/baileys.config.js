// Configuración específica para Baileys
module.exports = {
  // Configuración básica
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

  // Configuración para reconexión
  reconnect: {
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
    defaultQueryTimeoutMs: 0,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  },

  // Configuración de browser
  browser: ['Baileys API', 'Chrome', '1.0.0'],

  // Configuración de logger
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  }
};
