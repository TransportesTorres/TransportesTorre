# 🚀 PRÓXIMOS PASOS - GUÍA RÁPIDA
## Configurar WhatsApp en 10 Minutos

---

## 📋 PASO 1: CREAR CUENTA TWILIO (5 minutos)

### 1.1 Registro
```
URL: https://www.twilio.com/try-twilio
```

**Completar:**
- Nombre completo
- Email
- Contraseña
- País: Chile
- Tipo de uso: SMS, WhatsApp

### 1.2 Verificación
- Recibirás email → Click en enlace de verificación
- Te pedirá verificar tu número de teléfono
- Ingresa tu número: **+56 9 XXXX XXXX**
- Recibirás código por SMS
- Ingresa el código

### 1.3 Encuesta Inicial
Twilio preguntará:
- **¿Qué vas a construir?** → Notificaciones para clientes
- **¿Qué lenguaje usas?** → Node.js
- **¿Usarás para trabajo?** → Sí

**✅ Completado:** Ya tienes cuenta Trial con **USD $15.50 gratis**

---

## 📋 PASO 2: OBTENER CREDENCIALES (2 minutos)

### 2.1 Ir al Dashboard
```
URL: https://console.twilio.com
```

### 2.2 Copiar Credenciales

En la esquina superior derecha verás **"Account Info"**:

```
┌─────────────────────────────────────────┐
│ Account SID                             │
│ ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      │
│ [Copy]                                  │
├─────────────────────────────────────────┤
│ Auth Token                              │
│ [Show] ••••••••••••••••••••••           │
│ [Copy]                                  │
└─────────────────────────────────────────┘
```

**Copiar:**
1. **Account SID** (comienza con `AC...`)
2. Click en **[Show]** en Auth Token
3. **Auth Token** (aparecerá el token completo)

### 2.3 Obtener Trial Number

```
Dashboard > Phone Numbers > Manage > Active Numbers
```

Verás tu número de prueba, por ejemplo:
```
+1 415 XXX XXXX
```

**✅ Completado:** Tienes las 3 credenciales necesarias

---

## Paso 3: Configurar Variables de Entorno (1 minuto)

Editar archivo `.env.local`:

```env
# Copiar estos valores desde Twilio Console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui

# Para testing usar el número del WhatsApp Sandbox (NO comprar número)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Este puede dejarse vacío para testing (NO es necesario comprar número)
TWILIO_PHONE_NUMBER=
```

⚠️ **IMPORTANTE:** En cuenta Trial **NO necesitas comprar ningún número**. Usarás el WhatsApp Sandbox gratuito.

---

## 📋 PASO 4: CONFIGURAR WHATSAPP SANDBOX (2 minutos)

### 4.1 Ir a WhatsApp Sandbox

```
Dashboard > Messaging > Try it out > Try WhatsApp
```

Verás instrucciones como:

```
┌─────────────────────────────────────────────────┐
│ To connect your WhatsApp to this sandbox,      │
│ send this code in a WhatsApp message to        │
│ the number listed:                              │
│                                                 │
│ join <tu-codigo-unico>                          │
│                                                 │
│ Example: join red-tiger                         │
│                                                 │
│ Send it to: +1 415 523 8886                     │
└─────────────────────────────────────────────────┘
```

### 4.2 Enviar WhatsApp

1. Abrir WhatsApp en tu teléfono
2. Crear nuevo chat con: **+1 415 523 8886**
3. Enviar mensaje exacto: `join tu-codigo-aqui`
   - Ejemplo: `join red-tiger`

### 4.3 Confirmación

Recibirás respuesta de Twilio:

```
You are now connected to the Twilio Sandbox!
Reply "stop" to disconnect.
```

**✅ Completado:** WhatsApp configurado

---

## 📋 PASO 5: CREAR TABLA DE LOGS (1 minuto)

### 5.1 Ir a Supabase

```
URL: https://supabase.com/dashboard
```

### 5.2 Seleccionar Proyecto

Click en tu proyecto: **reservastransportes**

### 5.3 Abrir SQL Editor

```
Dashboard > SQL Editor > New Query
```

### 5.4 Copiar y Ejecutar SQL

Abrir en VS Code:
```
create_notification_logs_table.sql
```

Copiar **todo el contenido** del archivo y pegarlo en Supabase SQL Editor.

### 5.5 Ejecutar

Click en botón **"Run"** (esquina inferior derecha)

Deberías ver:
```
✅ Success. No rows returned
```

**✅ Completado:** Tabla creada

---

## 📋 PASO 6: REINICIAR SERVIDOR (30 segundos)

### 6.1 Detener Servidor Actual

En la terminal donde corre `npm run dev`:
```
Ctrl + C
```

### 6.2 Reiniciar

```bash
npm run dev
```

### 6.3 Verificar Configuración

Abrir en navegador:
```
http://localhost:3000/api/notifications/send
```

**Deberías ver:**
```json
{
  "success": true,
  "config": {
    "emailEnabled": true,
    "whatsappEnabled": true,
    "whatsappNumber": "whatsapp:+14155238886"
  }
}
```

**Si ves esto → ✅ TODO CONFIGURADO CORRECTAMENTE**

---

## 📋 PASO 7: PROBAR ENVÍO (2 minutos)

### 7.1 Crear Reserva de Prueba

1. Ir a: `http://localhost:3000`
2. Iniciar sesión
3. Crear nueva reserva con:
   - **Email:** tu email real
   - **Teléfono:** tu número (el que uniste al sandbox)
   - Formato: `+56912345678`

### 7.2 Verificar Recepción

Deberías recibir:
- ✅ Email en tu bandeja
- ✅ WhatsApp en tu teléfono

### 7.3 Revisar Logs

En la consola del servidor buscar:

```
🔔 Enviando notificaciones de nueva reserva...
✅ Notificaciones enviadas al cliente
  ✓ Email enviado
  ✓ WhatsApp enviado
✅ Notificaciones enviadas al admin
  ✓ Email enviado
```

**✅ ÉXITO:** Estás enviando notificaciones por Email + WhatsApp!

---

## 🎉 ¡FELICITACIONES!

```
┌─────────────────────────────────────────┐
│                                         │
│   ✅  WhatsApp está funcionando         │
│                                         │
│   Próximas reservas enviarán:          │
│   • Email                               │
│   • WhatsApp                            │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### ❌ Error: "whatsappEnabled": false

**Causa:** Variables de entorno no configuradas correctamente

**Solución:**
1. Revisar `.env.local`
2. Verificar que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` están completos
3. Asegúrate de incluir `TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886`
4. Reiniciar servidor: `Ctrl+C` y luego `npm run dev`

### ❌ "Solo veo opción de comprar número"

**Esto es NORMAL en cuenta Trial.**

**NO necesitas comprar ningún número para WhatsApp.**

**Solución:**
1. Ve a: **Messaging > Try it out > Try WhatsApp**
2. Busca "WhatsApp Sandbox" en el menú izquierdo
3. Sigue las instrucciones para unirte al Sandbox
4. El Sandbox es 100% GRATUITO y funciona perfectamente para testing
3. Guardar archivo
4. Reiniciar servidor: `Ctrl+C` → `npm run dev`

---

### ❌ WhatsApp no llega

**Causa:** No te uniste al Sandbox

**Solución:**
1. Enviar WhatsApp a: `+1 415 523 8886`
2. Mensaje: `join tu-codigo`
3. Esperar confirmación
4. Intentar de nuevo

---

### ❌ Error: "Invalid phone number format"

**Causa:** Formato de teléfono incorrecto

**Solución:**
- ✅ Correcto: `+56912345678`
- ❌ Incorrecto: `912345678`
- ❌ Incorrecto: `56912345678`
- ❌ Incorrecto: `+56 9 1234 5678`

El número debe empezar con `+56` sin espacios.

---

### ❌ Solo llega Email, no WhatsApp

**Posibles causas:**
1. No unido al Sandbox → Enviar `join codigo`
2. Número con formato incorrecto → Usar `+56912345678`
3. Variables mal configuradas → Revisar `.env.local`

**Verificar logs:**
```bash
npm run dev
# Buscar: ⚠️ WhatsApp omitido
```

---

## 📞 AYUDA ADICIONAL

### Documentación Completa
```
TWILIO_SETUP_GUIDE.md          - Guía detallada
WHATSAPP_INTEGRATION_README.md - Documentación técnica
IMPLEMENTACION_COMPLETADA.md   - Resumen completo
```

### Soporte Twilio
```
URL: https://support.twilio.com
Docs: https://www.twilio.com/docs/whatsapp
```

### Revisar Logs en Twilio
```
Console > Monitor > Logs > Messaging
```

### Revisar Logs en Base de Datos
```sql
SELECT * FROM notification_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 SIGUIENTES PASOS (OPCIONAL)

### Agregar Más Números de Prueba

Si quieres que otros miembros del equipo reciban WhatsApp:

1. **Twilio Console** > Phone Numbers > Verified Caller IDs
2. Click **"+ Add a New Caller ID"**
3. Ingresar número: `+56912345678`
4. Twilio enviará código SMS
5. Ingresar código para verificar
6. **Unir al Sandbox:** Enviar `join codigo` desde ese número

### Monitorear Uso del Crédito Trial

```
Dashboard > Billing > Usage
```

Verás cuánto has gastado del crédito de $15.50

### Preparar Paso a Producción

Cuando quieras pasar a producción (sin limitaciones):

1. Agregar tarjeta de crédito: Dashboard > Billing
2. Comprar número chileno: Dashboard > Phone Numbers > Buy
3. Solicitar WhatsApp Business API
4. Crear plantillas para aprobación de Meta

**Ver guía completa en:** `TWILIO_SETUP_GUIDE.md` (sección "Pasar a Producción")

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta Twilio creada
- [ ] Account SID copiado
- [ ] Auth Token copiado
- [ ] Variables en `.env.local` configuradas
- [ ] WhatsApp Sandbox activo (mensaje `join` enviado)
- [ ] Tabla `notification_logs` creada en Supabase
- [ ] Servidor reiniciado
- [ ] Configuración verificada (API endpoint)
- [ ] Reserva de prueba creada
- [ ] Email recibido
- [ ] WhatsApp recibido
- [ ] Logs revisados

**Si todos tienen ✅ → ¡Estás listo!** 🎉

---

**¿Problemas?** Revisar: `TWILIO_SETUP_GUIDE.md` sección "Troubleshooting"  
**Última actualización:** 10 de noviembre de 2025
