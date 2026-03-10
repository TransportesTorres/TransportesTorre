# 📝 GUÍA: Crear Plantillas WhatsApp en Meta
## Para Producción con Twilio + WhatsApp Business API

---

## 📋 REQUISITOS PREVIOS

Antes de crear plantillas necesitas:

1. ✅ Cuenta Twilio con tarjeta de crédito agregada
2. ✅ WhatsApp Business API activado en Twilio
3. ✅ Facebook Business Manager account
4. ✅ WhatsApp Business Account vinculado

---

## 🚀 PASO 1: Activar WhatsApp Business API en Twilio

### 1.1 Ir a Twilio Console
```
https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders
```

### 1.2 Solicitar WhatsApp Business API
1. Click en "Request Access"
2. Completar información del negocio:
   - **Nombre:** Transportes Torres
   - **País:** Chile
   - **Categoría:** Transportation
   - **Sitio web:** viajestorres.cl
   - **Descripción:** Servicio de transporte privado

3. **Tiempo de aprobación:** 1-3 días hábiles

### 1.3 Recibirás Número WhatsApp
Una vez aprobado, Twilio te asignará un número para WhatsApp Business:
```
Ejemplo: whatsapp:+14155238886
```

---

## 📝 PASO 2: Acceder a Meta Business Manager

### 2.1 Crear/Acceder a Business Manager
```
https://business.facebook.com
```

### 2.2 Ir a WhatsApp Manager
```
Business Manager > WhatsApp Accounts > Message Templates
```

O directamente:
```
https://business.facebook.com/wa/manage/message-templates/
```

---

## 🎨 PASO 3: Crear las 6 Plantillas

### Plantilla 1: Reserva Creada (Cliente)

**Nombre de plantilla:** `reserva_creada_cliente`  
**Categoría:** UTILITY (confirmaciones)  
**Idioma:** Spanish (es)

**Contenido:**
```
🚗 *Transportes Torres*

¡Hola {{1}}! 

Hemos recibido tu solicitud de reserva exitosamente.

📋 *Detalles:*
• Código: *{{2}}*
• Origen: {{3}}
• Destino: {{4}}
• Pasajeros: {{5}}
• Hora: {{6}}

⏳ *Estado:* Pendiente de confirmación

Un administrador revisará tu solicitud pronto y te contactaremos para confirmar.

¿Dudas? Responde este mensaje 📱
```

**Variables (en orden):**
1. `{{1}}` = client_name
2. `{{2}}` = confirmation_code
3. `{{3}}` = pickup_location
4. `{{4}}` = dropoff_location
5. `{{5}}` = passenger_count
6. `{{6}}` = pickup_time

---

### Plantilla 2: Reserva Confirmada (Cliente)

**Nombre de plantilla:** `reserva_confirmada_cliente`  
**Categoría:** UTILITY  
**Idioma:** Spanish (es)

**Contenido:**
```
✅ *Reserva Confirmada*
🚗 Transportes Torres

¡Excelente noticia, {{1}}!

Tu reserva ha sido *confirmada*.

📋 *Código:* {{2}}
📍 *Ruta:* {{3}} → {{4}}
👥 *Pasajeros:* {{5}}
🕐 *Hora:* {{6}}

📱 *Próximo paso:*
Te contactaremos 24 horas antes del viaje con los datos del conductor y vehículo.

¡Gracias por elegir Transportes Torres! 🙌
```

**Variables:**
1. `{{1}}` = client_name
2. `{{2}}` = confirmation_code
3. `{{3}}` = pickup_location
4. `{{4}}` = dropoff_location
5. `{{5}}` = passenger_count
6. `{{6}}` = pickup_time

---

### Plantilla 3: Nueva Reserva (Admin)

**Nombre de plantilla:** `nueva_reserva_admin`  
**Categoría:** UTILITY  
**Idioma:** Spanish (es)

**Contenido:**
```
🔔 *Nueva Reserva Pendiente*
Admin Dashboard

📋 *Código:* {{1}}
👤 *Cliente:* {{2}}
📞 *Teléfono:* {{3}}

📍 *Origen:* {{4}}
📍 *Destino:* {{5}}
👥 *Pasajeros:* {{6}}
✈️ *Vuelo:* {{7}}

⚠️ *Acción requerida:*
Ingresa al dashboard admin para confirmar o asignar conductor.
```

**Variables:**
1. `{{1}}` = confirmation_code
2. `{{2}}` = client_name
3. `{{3}}` = contact_phone
4. `{{4}}` = pickup_location
5. `{{5}}` = dropoff_location
6. `{{6}}` = passenger_count
7. `{{7}}` = flight_number

---

### Plantilla 4: Viaje Asignado (Conductor)

**Nombre de plantilla:** `viaje_asignado_conductor`  
**Categoría:** UTILITY  
**Idioma:** Spanish (es)

**Contenido:**
```
🚗 *Nuevo Viaje Asignado*
Transportes Torres

Hola *{{1}}*,

Te hemos asignado un nuevo viaje:

📋 *Código:* {{2}}
📅 *Fecha:* {{3}}
🕐 *Hora:* {{4}}

👤 *Cliente:* {{5}}
📞 *Teléfono:* {{6}}
👥 *Pasajeros:* {{7}}

📍 *Origen:* {{8}}
📍 *Destino:* {{9}}
✈️ *Vuelo:* {{10}}

📝 *Requerimientos especiales:*
{{11}}

Por favor confirma recepción respondiendo este mensaje.

¡Buen viaje! 🚗
```

**Variables:**
1. `{{1}}` = driver_name
2. `{{2}}` = confirmation_code
3. `{{3}}` = service_date
4. `{{4}}` = pickup_time
5. `{{5}}` = client_name
6. `{{6}}` = contact_phone
7. `{{7}}` = passenger_count
8. `{{8}}` = pickup_location
9. `{{9}}` = dropoff_location
10. `{{10}}` = flight_number
11. `{{11}}` = special_requirements

---

### Plantilla 5: Conductor Asignado (Cliente)

**Nombre de plantilla:** `conductor_asignado_cliente`  
**Categoría:** UTILITY  
**Idioma:** Spanish (es)

**Contenido:**
```
🚗 *Conductor Asignado*
Transportes Torres

Hola {{1}},

Tu viaje ya tiene conductor asignado:

👤 *Conductor:* {{2}}
📞 *Teléfono:* {{3}}
🚙 *Vehículo:* {{4}}

📋 *Tu viaje:*
• Código: {{5}}
• Fecha: {{6}}
• Hora: {{7}}
• Origen: {{8}}
• Destino: {{9}}

El conductor se pondrá en contacto contigo 30 minutos antes de la hora programada.

¿Dudas? Llama a tu conductor o responde este mensaje.

¡Buen viaje! 🙌
```

**Variables:**
1. `{{1}}` = client_name
2. `{{2}}` = driver_name
3. `{{3}}` = driver_phone
4. `{{4}}` = vehicle_info
5. `{{5}}` = confirmation_code
6. `{{6}}` = service_date
7. `{{7}}` = pickup_time
8. `{{8}}` = pickup_location
9. `{{9}}` = dropoff_location

---

### Plantilla 6: Viaje Completado (Cliente)

**Nombre de plantilla:** `viaje_completado_cliente`  
**Categoría:** UTILITY  
**Idioma:** Spanish (es)

**Contenido:**
```
✅ *Viaje Completado*
🚗 Transportes Torres

Hola {{1}},

¡Esperamos que hayas tenido un excelente viaje!

📋 *Código de reserva:* {{2}}
📍 {{3}} → {{4}}

⭐ *¿Cómo fue tu experiencia?*
Tu opinión nos ayuda a mejorar.

Califica tu viaje aquí:
{{5}}

👤 *Conductor:* {{6}}
🚙 *Vehículo:* {{7}}

¡Gracias por elegir Transportes Torres!
Esperamos verte pronto 🙌

_Equipo Transportes Torres_
```

**Variables:**
1. `{{1}}` = client_name
2. `{{2}}` = confirmation_code
3. `{{3}}` = pickup_location
4. `{{4}}` = dropoff_location
5. `{{5}}` = rating_url (link para calificar)
6. `{{6}}` = driver_name
7. `{{7}}` = vehicle_info

---

## ⏳ PASO 4: Esperar Aprobación

### Tiempos de Aprobación
- **Normal:** 24-48 horas
- **Primera vez:** Puede tomar hasta 72 horas
- **Rechazos:** Puedes re-enviar con ajustes

### Verificar Estado
```
Meta Business Manager > WhatsApp > Message Templates
```

**Estados posibles:**
- 🟡 **Pending:** En revisión
- 🟢 **Approved:** Listo para usar
- 🔴 **Rejected:** Necesita ajustes

---

## 🔧 PASO 5: Actualizar Código (si es necesario)

Una vez aprobadas las plantillas, verifica que los nombres coincidan:

```typescript
// En notificationService.ts
export type NotificationTemplate = 
  | 'reserva_creada_cliente'          // ✅ Debe coincidir con Meta
  | 'reserva_confirmada_cliente'      // ✅
  | 'nueva_reserva_admin'             // ✅
  | 'viaje_asignado_conductor'        // ✅
  | 'conductor_asignado_cliente'      // ✅
  | 'viaje_completado_cliente';       // ✅
```

Si los nombres en Meta son diferentes, actualiza el código.

---

## 📞 PASO 6: Actualizar Variables de Entorno

Una vez aprobado WhatsApp Business API:

```env
# .env.local

# Twilio (Producción)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+56912345678  # Número chileno comprado (SMS)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Número WhatsApp asignado por Twilio
```

---

## 🧪 PASO 7: Testing

### 7.1 Verificar Configuración
```bash
curl http://localhost:3000/api/notifications/send
```

Debe mostrar:
```json
{
  "success": true,
  "config": {
    "emailEnabled": true,
    "whatsappEnabled": true
  }
}
```

### 7.2 Crear Reserva de Prueba
1. Usar tu número real (no necesita estar en Sandbox)
2. Verificar recepción de Email + WhatsApp
3. Revisar logs en Twilio Console

---

## ⚠️ PROBLEMAS COMUNES

### ❌ Plantilla Rechazada

**Razones comunes:**
- Uso de emojis no permitidos
- Formato incorrecto de variables
- Contenido considerado spam
- Links sin protocolo https://

**Solución:**
- Simplificar el texto
- Reducir emojis
- Seguir guías de Meta: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines

---

### ❌ "Template not found"

**Causa:** Nombre de plantilla no coincide

**Solución:**
```typescript
// Verificar que el nombre en código coincida con Meta
const templateName = 'reserva_creada_cliente';  // Debe ser EXACTO
```

---

### ❌ "Parameter count mismatch"

**Causa:** Número de variables no coincide con plantilla

**Solución:**
```typescript
// Si plantilla tiene 6 variables: {{1}} a {{6}}
// Debes enviar exactamente 6 parámetros
```

---

## 💰 COSTOS EN PRODUCCIÓN

### WhatsApp Business API (Twilio)
```
Conversaciones (24h):
├─ Iniciadas por negocio: $0.0042 USD
├─ Iniciadas por cliente: GRATIS
└─ Mensajes adicionales en misma conversación: GRATIS

Ejemplo 200 reservas/mes:
200 × $0.0042 = $0.84 USD/mes

Número chileno SMS: $3 USD/mes

Total: ~$3.84 USD/mes
```

**ROI:** Reducción de no-shows del 15% → Ahorro anual ~$13,200 USD  
**Inversión anual:** $46 USD  
**Retorno:** 287x

---

## 📊 MONITOREO

### Twilio Console
```
https://console.twilio.com/monitor/logs/whatsapp
```

**Métricas importantes:**
- Mensajes enviados
- Mensajes entregados
- Mensajes leídos
- Errores

### Base de Datos
```sql
SELECT 
  template_name,
  status,
  COUNT(*) as total
FROM notification_logs
WHERE channel = 'whatsapp'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY template_name, status;
```

---

## 🎯 CHECKLIST DE PRODUCCIÓN

- [ ] Cuenta Twilio con tarjeta de crédito
- [ ] WhatsApp Business API aprobado
- [ ] 6 plantillas creadas en Meta
- [ ] Plantillas aprobadas (estado: Approved)
- [ ] Variables de entorno actualizadas
- [ ] Número WhatsApp configurado
- [ ] Testing con números reales
- [ ] Monitoreo configurado
- [ ] Tabla notification_logs creada
- [ ] Backup de configuración actual

---

## 📞 SOPORTE

### Meta Business Support
```
https://business.facebook.com/help/support
```

### Twilio Support
```
https://support.twilio.com
```

### Documentación WhatsApp Templates
```
https://developers.facebook.com/docs/whatsapp/message-templates
```

---

## ✅ RESUMEN

**Tiempo total estimado:** 3-5 días
- Solicitud WhatsApp API: 1-3 días
- Creación de plantillas: 2 horas
- Aprobación de plantillas: 1-3 días
- Testing: 1 hora

**Costo mensual:** ~$3.84 USD para 200 reservas

**Ventaja:** Sin limitaciones de Sandbox, envío a cualquier número, máxima profesionalidad.

---

**Fecha:** 10 de noviembre de 2025  
**Próximo paso:** Solicitar WhatsApp Business API en Twilio Console  
