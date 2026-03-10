# Sistema de Notificaciones Dual: Email + WhatsApp
## Transportes Torres - Implementación Completada

---

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha integrado **WhatsApp** junto con el sistema de **Email** existente. Ahora todas las notificaciones se envían por **ambos canales simultáneamente**.

### 📋 Cambios Realizados

#### 1. Nuevos Archivos Creados

```
src/
├── lib/
│   ├── twilioClient.ts              ✅ Cliente Twilio configurado
│   ├── notificationService.ts       ✅ Servicio unificado (Email + WhatsApp)
│   └── notificationHelpers.ts       ✅ Helpers para Redux
├── app/
│   └── api/
│       └── notifications/
│           └── send/
│               └── route.ts         ✅ API endpoint para notificaciones

Documentación:
├── TWILIO_SETUP_GUIDE.md            ✅ Guía completa de configuración
├── create_notification_logs_table.sql ✅ Script SQL para logs
└── WHATSAPP_INTEGRATION_README.md   ✅ Este archivo
```

#### 2. Archivos Modificados

```
.env.local                           ✅ Variables Twilio agregadas
package.json                         ✅ Dependencia 'twilio' instalada
src/store/slices/reservationsSlice.ts ✅ Integración notificaciones duales
```

---

## 🚀 INICIO RÁPIDO

### Paso 1: Instalar Dependencias (Ya Hecho)

```bash
npm install twilio
```

### Paso 2: Configurar Twilio

#### Opción A: Testing con Cuenta Trial (GRATIS)

1. **Crear cuenta:** https://www.twilio.com/try-twilio
2. **Obtener credenciales:**
   - Account SID (comienza con `AC...`)
   - Auth Token
   - Trial Number
3. **Configurar `.env.local`:**

```env
# Twilio (WhatsApp + SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+56912345678
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

4. **Verificar tu número de prueba:**
   - Twilio Console > Phone Numbers > Verified Caller IDs
   - Agregar tu número personal (+56...)

5. **Unirse al WhatsApp Sandbox:**
   - Enviar WhatsApp a: `+1 415 523 8886`
   - Mensaje: `join <tu-codigo-sandbox>`

#### Opción B: Producción (Requiere tarjeta de crédito)

Ver guía completa en: `TWILIO_SETUP_GUIDE.md`

### Paso 3: Crear Tabla de Logs en Supabase

1. Ir a Supabase Dashboard > SQL Editor
2. Ejecutar el contenido de: `create_notification_logs_table.sql`
3. Click "Run"

### Paso 4: Reiniciar Servidor

```bash
npm run dev
```

---

## 🧪 PROBAR LA INTEGRACIÓN

### Verificar Configuración

Abrir en navegador:
```
http://localhost:3000/api/notifications/send
```

Deberías ver:
```json
{
  "success": true,
  "config": {
    "emailEnabled": true,
    "whatsappEnabled": true,
    "whatsappNumber": "whatsapp:+..."
  }
}
```

### Crear Reserva de Prueba

1. Ir a la aplicación
2. Crear nueva reserva con:
   - **Email:** Tu email personal
   - **Teléfono:** Tu número verificado en Twilio (formato: +56912345678)
3. Deberías recibir:
   - ✅ Email de confirmación
   - ✅ WhatsApp de confirmación

### Revisar Logs

En la consola del servidor:
```
🔔 Enviando notificaciones de nueva reserva...
✅ Notificaciones enviadas al cliente
  ✓ Email enviado
  ✓ WhatsApp enviado
✅ Notificaciones enviadas al admin
  ✓ Email enviado
```

---

## 📱 NOTIFICACIONES IMPLEMENTADAS

El sistema envía **Email + WhatsApp** en estos momentos:

| Evento | Destinatario | Plantilla |
|--------|--------------|-----------|
| **Nueva reserva** | Cliente | `reservation_created` |
| **Nueva reserva** | Admin | `new_reservation_admin` |
| **Reserva confirmada** | Cliente | `reservation_confirmed` |
| **Conductor asignado** | Cliente | `driver_assigned` |
| **Conductor asignado** | Conductor | `trip_assigned_driver` |
| **Viaje completado** | Cliente | `trip_completed` |

---

## 🔧 CÓMO FUNCIONA

### Flujo de Notificaciones

```
Usuario crea reserva
    ↓
reservationsSlice.ts (createReservation)
    ↓
notificationHelpers.ts (sendReservationCreatedNotification)
    ↓
API: /api/notifications/send
    ↓
notificationService.ts
    ├─→ Email (emailService.ts)
    └─→ WhatsApp (twilioClient.ts)
    ↓
Guardar log en notification_logs (Supabase)
```

### Ventajas del Sistema Dual

1. **Redundancia:** Si falla un canal, el otro sigue funcionando
2. **Mayor alcance:** 
   - Email: 100% usuarios
   - WhatsApp: ~98% usuarios chilenos
3. **Confirmación de lectura:** WhatsApp tiene doble check
4. **Multimedia:** Futuro - enviar mapas, fotos de conductor

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Deshabilitar WhatsApp Temporalmente

Simplemente deja vacías las variables en `.env.local`:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

El sistema automáticamente solo enviará emails.

### Personalizar Plantillas de WhatsApp

Editar: `src/lib/notificationService.ts`

Buscar método `getWhatsAppTemplates()` y modificar los mensajes.

### Agregar Nuevo Tipo de Notificación

1. **Agregar plantilla en `notificationService.ts`:**
```typescript
reminder_24h: (data) => `⏰ Recordatorio...`
```

2. **Crear helper en `notificationHelpers.ts`:**
```typescript
export async function sendReminder24h(...)
```

3. **Usar en Redux slice:**
```typescript
import { sendReminder24h } from '@/lib/notificationHelpers';
await sendReminder24h(clientEmail, clientPhone, data);
```

---

## 📊 MONITOREO

### Ver Logs en Supabase

```sql
SELECT 
  channel,
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as exitosos,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidos
FROM notification_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY channel, status;
```

### Ver Logs en Twilio Console

1. https://console.twilio.com
2. Monitor > Logs > Messaging
3. Filtrar por fecha y estado

---

## 💰 COSTOS

### Cuenta Trial (Gratis)
- Crédito: USD $15.50
- ~250 SMS
- ~3,690 conversaciones WhatsApp
- Solo para testing

### Cuenta Paga (200 reservas/mes)
```
WhatsApp: 800 mensajes × USD $0.0042 = USD $3.36
Número +56: USD $3.00
Total mensual: USD $6.36
Total anual: USD $76.32
```

---

## ❓ SOLUCIÓN DE PROBLEMAS

### WhatsApp no se envía

**Síntoma:** Solo llega email, no WhatsApp

**Causas posibles:**
1. Variables de entorno no configuradas
2. Número no verificado (cuenta Trial)
3. No unido al Sandbox
4. Formato de teléfono incorrecto

**Solución:**
```bash
# Ver logs en consola
npm run dev

# Buscar:
⚠️ Twilio not configured
❌ Invalid phone number format
```

### Error: "Permission denied"

**Causa:** Número no verificado en cuenta Trial

**Solución:**
1. Twilio Console > Phone Numbers > Verified Caller IDs
2. Agregar número
3. Verificar con código SMS

### Email llega pero WhatsApp no

**Causa:** No unido al Sandbox

**Solución:**
1. Enviar WhatsApp a: `+1 415 523 8886`
2. Mensaje: `join <codigo>`
3. Esperar confirmación

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Guía completa de configuración:** `TWILIO_SETUP_GUIDE.md`
- **Cotización de implementación:** `COTIZACION_TWILIO.md` o `COTIZACION_TWILIO_TEXTO.md`
- **Documentación Twilio:** https://www.twilio.com/docs/whatsapp
- **Políticas WhatsApp:** https://developers.facebook.com/docs/whatsapp

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

### Corto Plazo (1-2 semanas)
- [ ] Configurar cuenta Trial de Twilio
- [ ] Probar con números personales
- [ ] Revisar logs y métricas
- [ ] Ajustar mensajes si es necesario

### Mediano Plazo (1 mes)
- [ ] Pasar a cuenta paga
- [ ] Comprar número chileno
- [ ] Solicitar WhatsApp Business API
- [ ] Crear plantillas para aprobación de Meta

### Largo Plazo (2-3 meses)
- [ ] Implementar recordatorios automáticos 24h antes
- [ ] Agregar botones interactivos (Confirmar/Cancelar)
- [ ] Enviar fotos del conductor y vehículo
- [ ] Tracking en tiempo real con mapas

---

## 🆘 SOPORTE

### Problemas con el código
1. Revisar logs del servidor: `npm run dev`
2. Revisar tabla `notification_logs` en Supabase
3. Verificar configuración: `http://localhost:3000/api/notifications/send`

### Problemas con Twilio
1. Twilio Console > Monitor > Logs
2. Support: https://support.twilio.com
3. Documentación: https://www.twilio.com/docs

---

**Fecha de implementación:** 10 de noviembre de 2025  
**Status:** ✅ Completado y listo para testing

**Desarrollado para:** Transportes Torres SpA  
**Tecnología:** Next.js 14, Twilio, Supabase
