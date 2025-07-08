# 📧 **Configuración del Sistema de Correos - Nodemailer**
### **Transportes Torres SpA - Guía Completa**

---

## 🚀 **PASO 1: Instalar Dependencias**

```bash
npm install nodemailer @types/nodemailer handlebars
```

---

## 🔧 **PASO 2: Configurar Variables de Entorno**

### **Crear archivo `.env.local` en la raíz del proyecto:**

```env
# ===================================================================
# CONFIGURACIÓN DE CORREO (NODEMAILER)
# ===================================================================

# Gmail (Recomendado para empezar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-16-caracteres

# URL de tu aplicación
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (ya las tienes)
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

---

## 📧 **PASO 3: Configurar Gmail (Recomendado)**

### **3.1 Generar Contraseña de Aplicación:**
1. Ve a [Google Account](https://myaccount.google.com/)
2. **Seguridad** → **Verificación en 2 pasos** (activar)
3. **Contraseñas de aplicaciones** → **Generar nueva**
4. Selecciona **"Correo"** y **"Otro dispositivo personalizado"**
5. Nombre: **"Transportes Torres"**
6. **Copia la contraseña de 16 caracteres**

### **3.2 Configurar en .env.local:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@transportestorres.cl
SMTP_PASS=abcd efgh ijkl mnop  # La contraseña de 16 caracteres
```

---

## 🔄 **PASO 4: Integrar con Redux**

### **4.1 Actualizar el slice de reservations:**

```typescript
// En src/store/slices/reservationsSlice.ts
import { sendAutomaticEmails } from '@/lib/emailHelpers';

// Agregar en extraReducers
.addCase(createReservation.fulfilled, (state, action) => {
  state.reservations.push(action.payload);
  state.loading = false;
  
  // Enviar correos automáticamente
  const reservation = action.payload;
  if (reservation.id && reservation.user_id) {
    sendAutomaticEmails(
      reservation.id,
      reservation.user_email || '', // Agregar email del usuario
      'created'
    ).then(result => {
      console.log('Emails sent:', result);
    }).catch(error => {
      console.error('Email error:', error);
    });
  }
})
```

### **4.2 Agregar en confirmación de reserva:**

```typescript
// En el componente admin
const handleConfirmReservation = async (reservationId: string) => {
  try {
    // Confirmar reserva
    await dispatch(updateReservationStatus({ 
      id: reservationId, 
      status: 'confirmed' 
    }));
    
    // Enviar correos automáticamente
    const result = await sendAutomaticEmails(
      reservationId,
      clientEmail, // Obtener del estado
      'confirmed',
      driverEmail // Obtener del conductor asignado
    );
    
    if (result.success) {
      showToast('Reserva confirmada y correos enviados', 'success');
    }
  } catch (error) {
    showToast('Error al confirmar reserva', 'error');
  }
};
```

---

## 🧪 **PASO 5: Probar el Sistema**

### **5.1 Verificar configuración:**
```typescript
import { verifyEmailConfiguration } from '@/lib/emailHelpers';

const checkEmailConfig = async () => {
  const result = await verifyEmailConfiguration();
  console.log('Email config:', result);
};
```

### **5.2 Enviar correo de prueba:**
```typescript
import { sendReservationCreatedEmail } from '@/lib/emailHelpers';

// Usar con una reserva real
const testEmail = await sendReservationCreatedEmail(
  'reservation-id',
  'test@example.com'
);
console.log('Test result:', testEmail);
```

---

## 📊 **PASO 6: Monitorear Correos**

### **6.1 Ver logs en base de datos:**
```sql
SELECT 
  recipient_email,
  template_name,
  status,
  created_at,
  error_message
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### **6.2 Ver estadísticas:**
```sql
SELECT 
  template_name,
  status,
  COUNT(*) as cantidad
FROM email_logs 
GROUP BY template_name, status
ORDER BY template_name;
```

---

## 🎯 **PASO 7: Configuraciones Alternativas**

### **7.1 Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
```

### **7.2 SendGrid (Para producción):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
```

### **7.3 Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@yahoo.com
SMTP_PASS=tu-contraseña
```

---

## 🔧 **PASO 8: Personalizar Plantillas**

### **Las plantillas están en `src/lib/emailService.ts`:**
- `reservation_created` - Cliente recibe confirmación
- `reservation_confirmed` - Cliente notificado de confirmación
- `new_reservation_admin` - Admin notificado de nueva reserva
- `trip_assigned_driver` - Conductor notificado de viaje
- `trip_completed` - Cliente notificado de viaje completado

### **Para personalizar:**
1. Edita las plantillas HTML en `getTemplates()`
2. Modifica estilos CSS inline
3. Agrega nuevas variables en `ReservationEmailData`

---

## ⚡ **VENTAJAS vs Supabase:**

### **✅ Nodemailer:**
- 🔄 **Control total** del envío
- 📧 **Sin límites** de correos
- 🎨 **Plantillas personalizadas** con Handlebars
- 💰 **Más económico** a largo plazo
- 📊 **Mejor tracking** y logs

### **✅ Supabase:**
- 🚀 **Setup inmediato**
- 🔧 **Menos configuración**
- 📱 **Perfecto para pruebas**

---

## 🚨 **Solución de Problemas**

### **Error de conexión SMTP:**
1. Verificar credenciales en `.env.local`
2. Comprobar que 2FA está activado en Gmail
3. Generar nueva contraseña de aplicación
4. Verificar firewall/proxy

### **Correos no llegan:**
1. Revisar carpeta de spam
2. Verificar límites del proveedor
3. Comprobar logs en `email_logs`
4. Validar direcciones de email

### **Error 'nodemailer not found':**
```bash
npm install nodemailer @types/nodemailer handlebars
```

---

## 🎉 **¡Sistema Listo!**

### **Flujo automático implementado:**
1. **Cliente reserva** → 📧 Cliente + 📧 Admin
2. **Admin confirma** → 📧 Cliente + 🚗 Conductor  
3. **Viaje completo** → ✅ Cliente con código

### **APIs disponibles:**
- `POST /api/email/send` - Enviar correo específico
- `GET /api/email/send` - Verificar configuración SMTP

### **Funciones helper:**
- `sendAutomaticEmails()` - Enviar correos automáticos
- `sendReservationCreatedEmail()` - Correo de reserva creada
- `sendReservationConfirmedEmail()` - Correo de confirmación
- `verifyEmailConfiguration()` - Verificar conexión

**🚀 ¡Tu sistema de correos profesional está listo para usar!** 