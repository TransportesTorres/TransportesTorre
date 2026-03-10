# Guía de Configuración de WhatsApp con Twilio
## Sistema de Notificaciones - Transportes Torres

---

## 1. CREAR CUENTA DE TWILIO

### Paso 1: Registro
1. Ir a https://www.twilio.com/try-twilio
2. Completar el formulario de registro
3. Verificar tu email
4. Verificar tu número de teléfono

### Paso 2: Obtener Credenciales Trial
Después de registrarte, obtendrás:
- **Account SID**: Comienza con `AC...`
- **Auth Token**: Token secreto
- **Trial Number**: Tu número de prueba de Twilio
- **Crédito**: USD $15.50 gratuito

**Ubicación:**
```
Dashboard > Account Info (esquina superior derecha)
```

---

## 2. CONFIGURAR NÚMERO DE TELÉFONO

### Opción A: Usar Número Trial (GRATIS - Para Testing)

**Características:**
- Gratis con cuenta Trial
- Solo puede enviar a números verificados
- Incluye marca "Sent from your Twilio trial account"

**Cómo verificar números de prueba:**
1. Dashboard > Phone Numbers > Verified Caller IDs
2. Click en "+ Add a New Caller ID"
3. Ingresar número chileno (ej: +56912345678)
4. Twilio enviará código de verificación
5. Ingresar código para verificar

### Opción B: Comprar Número Chileno (PRODUCCIÓN)

**Costo:** USD $3.00/mes

**Pasos:**
1. Dashboard > Phone Numbers > Buy a Number
2. Filtrar por:
   - Country: Chile (+56)
   - Capabilities: SMS, MMS
3. Seleccionar número disponible
4. Click "Buy"
5. Agregar tarjeta de crédito (necesario para comprar)

---

## 3. CONFIGURAR WHATSAPP

### Importante: WhatsApp Business API

Para WhatsApp necesitas:
1. **Cuenta Business de Facebook** (si no tienes, créala gratis)
2. **Aprobación de Meta** para plantillas de mensajes

### Paso 1: Activar WhatsApp en Twilio

1. Dashboard > Messaging > Try it out > Try WhatsApp
2. Seguir wizard de configuración
3. Conectar con tu cuenta de Facebook Business

### Paso 2: Configurar Sandbox (Para Testing)

**WhatsApp Sandbox** permite testing sin aprobación de Meta:

1. Dashboard > Messaging > Try it out > Send a WhatsApp message
2. Verás instrucciones como:

```
Para probar, envía un WhatsApp a: +1 415 523 8886
Con el mensaje: join <tu-codigo-sandbox>
Ejemplo: join red-tiger
```

3. Envía ese mensaje desde tu WhatsApp personal
4. Recibirás confirmación: "You are now connected to the Twilio Sandbox"

**Número del Sandbox:**
```
whatsapp:+14155238886
```

**Importante:** Cada persona que quiera recibir mensajes debe "unirse" al sandbox.

### Paso 3: Configurar WhatsApp en Producción

Para usar WhatsApp en producción (sin sandbox):

1. **Solicitar número WhatsApp Business:**
   - Dashboard > Phone Numbers > Buy a Number
   - Habilitar "WhatsApp" capability
   - Costo adicional: ~USD $3-5/mes

2. **Crear plantillas de mensajes:**
   - Dashboard > Messaging > WhatsApp > Templates
   - Crear plantillas según políticas de Meta
   - Enviar para aprobación (24-72 horas)

**Ejemplo de plantilla aprobable:**
```
Nombre: reserva_confirmada
Categoría: UTILITY (transaccional)
Contenido:
Hola {{1}}, tu reserva {{2}} está confirmada.
Origen: {{3}}
Destino: {{4}}
Fecha: {{5}}
```

**No aprobable (muy promocional):**
```
¡OFERTA! 50% descuento en tu próximo viaje. ¡Reserva YA!
```

---

## 4. CONFIGURAR VARIABLES DE ENTORNO

Editar `.env.local` en tu proyecto:

### Para Testing (Sandbox):

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+56912345678
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Para Producción:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+56912345678
TWILIO_WHATSAPP_NUMBER=whatsapp:+56912345678
```

**Cómo obtener cada variable:**

| Variable | Ubicación en Twilio Console |
|----------|----------------------------|
| `TWILIO_ACCOUNT_SID` | Dashboard > Account Info > Account SID |
| `TWILIO_AUTH_TOKEN` | Dashboard > Account Info > Auth Token (Click "Show") |
| `TWILIO_PHONE_NUMBER` | Dashboard > Phone Numbers > Active Numbers |
| `TWILIO_WHATSAPP_NUMBER` | Mismo que PHONE_NUMBER con prefijo `whatsapp:` |

---

## 5. VERIFICAR CONFIGURACIÓN

### Opción 1: Desde la Aplicación

1. Abrir navegador: http://localhost:3000
2. Ir a: http://localhost:3000/api/notifications/send
3. Deberías ver JSON con:

```json
{
  "success": true,
  "config": {
    "emailEnabled": true,
    "whatsappEnabled": true,
    "whatsappNumber": "whatsapp:+56912345678"
  }
}
```

### Opción 2: Probar Envío Manual

Usa Postman o curl:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "cliente@ejemplo.com",
    "recipientPhone": "+56912345678",
    "templateName": "reservation_created",
    "notificationData": {
      "client_name": "Juan Pérez",
      "confirmation_code": "TEST-001",
      "pickup_location": "Aeropuerto SCL",
      "dropoff_location": "Hotel Centro Santiago",
      "passenger_count": 2,
      "contact_phone": "+56912345678"
    }
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "results": {
    "email": {
      "success": true,
      "messageId": "..."
    },
    "whatsapp": {
      "success": true,
      "messageId": "SM..."
    }
  }
}
```

---

## 6. TESTING CON CUENTA TRIAL

### Limitaciones de la Cuenta Trial:

1. **Solo números verificados:** Debes verificar cada número manualmente
2. **Marca de agua:** SMS incluyen "Sent from your Twilio trial account"
3. **Límite de crédito:** USD $15.50 (~250 SMS o ~3,690 WhatsApp)

### Cómo Probar:

1. **Verificar tu propio número:**
   - Dashboard > Phone Numbers > Verified Caller IDs
   - Agregar tu número personal chileno

2. **Unirse al WhatsApp Sandbox:**
   - Enviar WhatsApp a +1 415 523 8886
   - Mensaje: `join <tu-codigo>`

3. **Crear una reserva de prueba:**
   - Ir a la aplicación
   - Crear reserva con tu email y teléfono verificado
   - Deberías recibir email + WhatsApp

4. **Revisar logs:**
   ```bash
   npm run dev
   ```
   Buscar en consola:
   ```
   🔔 Enviando notificaciones de nueva reserva...
   ✅ Notificaciones enviadas al cliente
     ✓ Email enviado
     ✓ WhatsApp enviado
   ```

---

## 7. PASAR A PRODUCCIÓN

### Paso 1: Actualizar Cuenta Twilio

1. Agregar tarjeta de crédito:
   - Dashboard > Billing
   - Add Payment Method

2. La cuenta automáticamente se convierte en "Pay As You Go"
3. Ya no tiene limitación de números verificados

### Paso 2: Comprar Número Chileno

Ver "Opción B: Comprar Número Chileno" arriba.

### Paso 3: Configurar WhatsApp Producción

1. **Solicitar WhatsApp Business API:**
   - Dashboard > Messaging > WhatsApp
   - Apply for WhatsApp Business API

2. **Crear plantillas:**
   - Usar las plantillas en `notificationService.ts` como base
   - Crear en Twilio Console
   - Enviar para aprobación de Meta

3. **Esperar aprobación:** 24-72 horas

### Paso 4: Actualizar Variables de Entorno

Cambiar en `.env.local`:
```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+56912345678
```

### Paso 5: Deploy

```bash
npm run build
# Subir a tu servidor de producción
```

---

## 8. MONITOREO Y DEBUGGING

### Ver Logs en Twilio Console

1. Dashboard > Monitor > Logs
2. Filtrar por:
   - SMS Messages
   - WhatsApp Messages
3. Ver estado:
   - `queued`: Enviado a Twilio
   - `sent`: Enviado a operador
   - `delivered`: Entregado al usuario
   - `failed`: Error

### Revisar Logs en Base de Datos

```sql
SELECT * FROM notification_logs 
WHERE sent_at > NOW() - INTERVAL '1 day'
ORDER BY sent_at DESC;
```

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `21211: Invalid 'To' number` | Formato incorrecto | Usar +56912345678 |
| `21408: Permission denied` | Número no verificado (Trial) | Verificar en Console |
| `63007: WhatsApp not enabled` | No configurado | Habilitar WhatsApp |
| `63016: Template not approved` | Plantilla pendiente | Esperar aprobación Meta |

---

## 9. COSTOS ESTIMADOS

### Escenario: 200 reservas/mes

**Con Cuenta Trial (Gratis):**
- Crédito: USD $15.50
- Duración: ~50 reservas (4 notificaciones c/u × USD $0.0042 WhatsApp)

**Con Cuenta Paga:**
```
200 reservas × 4 notificaciones = 800 mensajes

WhatsApp: 800 × USD $0.0042 = USD $3.36
Número: USD $3.00
Total mensual: USD $6.36

Total anual: USD $76.32
```

---

## 10. SOPORTE Y RECURSOS

### Documentación Oficial:
- **Twilio SMS:** https://www.twilio.com/docs/sms
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **Node.js SDK:** https://www.twilio.com/docs/libraries/node

### Twilio Console:
- **URL:** https://console.twilio.com
- **Support:** https://support.twilio.com

### Meta WhatsApp Policies:
- https://developers.facebook.com/docs/whatsapp/message-templates

---

## 11. CHECKLIST DE CONFIGURACIÓN

### Testing (Trial):
- [ ] Cuenta Twilio creada
- [ ] Credenciales obtenidas (SID + Token)
- [ ] Número de prueba verificado
- [ ] Variables en `.env.local` configuradas
- [ ] Tu número personal verificado en Console
- [ ] Unido al WhatsApp Sandbox
- [ ] Prueba de envío exitosa
- [ ] Logs revisados

### Producción:
- [ ] Tarjeta de crédito agregada
- [ ] Número chileno comprado (+56)
- [ ] WhatsApp Business API solicitado
- [ ] Plantillas enviadas a Meta
- [ ] Plantillas aprobadas (24-72h)
- [ ] Variables de producción actualizadas
- [ ] Deploy realizado
- [ ] Monitoreo configurado

---

**Última actualización:** 10 de noviembre de 2025

Para dudas o problemas, revisar:
1. Logs de aplicación (`npm run dev`)
2. Twilio Console > Monitor > Logs
3. Tabla `notification_logs` en base de datos
