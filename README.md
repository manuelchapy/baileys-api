# Baileys API - WhatsApp para n8n

Una API REST completa para WhatsApp usando la biblioteca Baileys, optimizada para usar con n8n.

## 🚀 Características

- ✅ Generación automática de código QR para vincular dispositivos
- ✅ Interfaz web para escanear QR
- ✅ API REST completa para n8n
- ✅ Soporte para Vercel
- ✅ Manejo de estado de conexión
- ✅ Envío de mensajes
- ✅ Obtención de contactos

## 📁 Estructura del Proyecto

```
baileys-api/
├── controllers/
│   └── whatsapp.controller.js
├── routes/
│   └── whatsapp.route.js
├── views/
│   └── qr.ejs
├── app.js
├── index.js
├── package.json
├── vercel.json
└── README.md
```

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd baileys-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env
NODE_ENV=development
PORT=3000
HOST=localhost
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Ejecutar en producción**
```bash
npm start
```

## 🌐 Uso

### Acceso a la interfaz web
- **Desarrollo local**: http://localhost:3000
- **Alternativa local**: http://127.0.0.1:3000
- **Vercel**: https://tu-dominio.vercel.app

### Endpoints de la API

#### 1. **Estado de la API**
```http
GET /api/status
```

#### 2. **Conectar WhatsApp**
```http
POST /api/whatsapp/connect
```

#### 3. **Obtener código QR**
```http
GET /api/whatsapp/qr
```

#### 4. **Estado de WhatsApp**
```http
GET /api/whatsapp/status
```

#### 5. **Enviar mensaje**
```http
POST /api/whatsapp/send-message
Content-Type: application/json

{
  "phoneNumber": "1234567890",
  "message": "Hola desde n8n!"
}
```

#### 6. **Obtener contactos**
```http
GET /api/whatsapp/contacts
```

#### 7. **Desconectar WhatsApp**
```http
POST /api/whatsapp/disconnect
```

#### 8. **Limpiar Sesión**
```http
POST /api/whatsapp/clear-session
```

#### 9. **Enviar Mensaje de Bienvenida**
```http
POST /api/whatsapp/welcome
```

#### 10. **Configurar Webhook**
```http
POST /api/whatsapp/webhook
{
  "webhookUrl": "http://localhost:5678/webhook-test/whatsapp"
}
```

## 🔗 Uso con n8n

### Configuración Automática
La API está configurada para usar automáticamente:
- **URL del webhook**: `http://localhost:5678/webhook-test/whatsapp`
- **Configuración automática** al conectar WhatsApp

### Configuración en n8n

#### **1. Importar Workflow**
1. Abre n8n en `http://localhost:5678`
2. Importa el archivo `n8n-workflow.json`
3. Activa el workflow

#### **2. Configuración Manual**
1. Crea un nuevo workflow
2. Agrega un nodo **"Webhook"**
3. Configura:
   - **HTTP Method**: POST
   - **Path**: `whatsapp`
   - **Response Mode**: Response Node
4. Agrega nodos para procesar el mensaje

1. **HTTP Request Node** para conectar:
   - Method: POST
   - URL: `https://tu-api.vercel.app/api/whatsapp/connect`

2. **HTTP Request Node** para obtener QR:
   - Method: GET
   - URL: `https://tu-api.vercel.app/api/whatsapp/qr`

3. **HTTP Request Node** para enviar mensaje:
   - Method: POST
   - URL: `https://tu-api.vercel.app/api/whatsapp/send-message`
   - Body:
     ```json
     {
       "phoneNumber": "{{ $json.phoneNumber }}",
       "message": "{{ $json.message }}"
     }
     ```

4. **HTTP Request Node** para verificar estado:
   - Method: GET
   - URL: `https://tu-api.vercel.app/api/whatsapp/status`

### Flujo recomendado en n8n

1. **Iniciar conexión** → POST /api/whatsapp/connect
2. **Obtener QR** → GET /api/whatsapp/qr
3. **Verificar estado** → GET /api/whatsapp/status (en loop hasta conectar)
4. **Enviar mensajes** → POST /api/whatsapp/send-message

## 🚀 Despliegue en Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno en Vercel**:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `HOST=0.0.0.0`

3. **Desplegar automáticamente**

## 📱 Proceso de vinculación

1. Accede a la URL de tu API
2. Se generará automáticamente un código QR
3. Abre WhatsApp en tu teléfono
4. Ve a Configuración → Dispositivos vinculados
5. Escanea el código QR
6. ¡Listo! Tu dispositivo estará vinculado

## 🔧 Configuración Avanzada

### Variables de entorno

```env
NODE_ENV=development|production
PORT=3000
HOST=localhost|0.0.0.0
```

### Personalización

- **Motor de plantillas**: EJS
- **Autenticación**: Se guarda en `auth_info/`
- **Logs**: Console.log habilitado
- **CORS**: Habilitado para todas las rutas

## 🐛 Solución de problemas

### Error de conexión
- Verifica que el puerto esté disponible
- Revisa los logs en la consola
- Asegúrate de que WhatsApp esté actualizado

### QR no se genera
- Verifica que la conexión esté iniciada
- Revisa el endpoint `/api/whatsapp/status`
- Intenta desconectar y volver a conectar

### Mensajes no se envían
- Verifica que WhatsApp esté conectado
- Revisa el formato del número de teléfono
- Asegúrate de que el número tenga WhatsApp

## 📄 Licencia

MIT License

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📞 Soporte

Para soporte, abre un issue en el repositorio o contacta al desarrollador.