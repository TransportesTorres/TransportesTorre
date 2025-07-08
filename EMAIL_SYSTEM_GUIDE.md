# 📧 **Guía Completa del Sistema de Correos**
### **Transportes Torres SpA - Sistema de Notificaciones**

---

## 🚀 **PASO 1: Probar INMEDIATAMENTE con Email por Defecto de Supabase**

### **✅ Ventajas del Email por Defecto:**
- **No necesitas configurar nada**
- **Funciona inmediatamente**
- **Límite: 3 correos por hora** (perfecto para pruebas)
- **Perfecto para desarrollo**

### **🔧 Ejecutar Scripts en Orden:**

1. **Ejecutar scripts base** (si no los has ejecutado):
```sql
-- En Supabase SQL Editor:
-- 1. ensure_reservations_table.sql
-- 2. email_notifications_system.sql
```

2. **Agregar tabla de conductores:**
```sql
-- 3. add_drivers_table.sql
```

3. **Extender sistema para conductores y viajes completados:**
```sql
-- 4. email_system_extended.sql
```

4. **Script de prueba inmediata:**
```sql
-- 5. test_email_simple.sql
```

---

## 🧪 **PASO 2: Probar el Sistema**

### **A. Prueba Básica (1 correo):**
```sql
-- Cambiar por tu email real para recibir el correo
SELECT * FROM quick_email_test('tu-email@gmail.com');
```

### **B. Probar Todas las Plantillas:**
```sql
-- Esto enviará todos los tipos de correo
SELECT * FROM test_all_templates('tu-email@gmail.com');
```

### **C. Ver Logs de Correos:**
```sql
SELECT 
  template_name,
  recipient_email,
  status,
  created_at,
  error_message
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📬 **PASO 3: Tipos de Correos Implementados**

### **1. Para CLIENTES:**
- ✉️ **`reservation_created`** - Confirmación de reserva recibida
- ✉️ **`reservation_confirmed`** - Reserva aprobada por admin
- ✉️ **`trip_completed`** - Viaje completado exitosamente

### **2. Para CONDUCTORES:**
- 🚗 **`trip_assigned_driver`** - Nuevo viaje asignado

### **3. Para ADMINISTRADORES:**
- 📊 **`new_reservation_admin`** - Nueva reserva pendiente

---

## ⚡ **PASO 4: Flujo Automático de Correos**

### **🔄 Cuando se crea una reserva:**
```
1. Cliente hace reserva → 📧 Cliente recibe "Reserva Recibida"
2. Automáticamente → 📧 Admin recibe "Nueva Reserva Pendiente"
```

### **🔄 Cuando admin confirma reserva:**
```
1. Admin confirma → 📧 Cliente recibe "Reserva Confirmada"
2. Automáticamente → 🚗 Conductor recibe "Viaje Asignado"
```

### **🔄 Cuando se completa el viaje:**
```
1. Estado cambia a "completed" → 📧 Cliente recibe "Viaje Completado"
```

---

## 🔧 **PASO 5: Cambiar Email del Admin**

**Por defecto está configurado:** `admin@transportestorres.cl`

**Para cambiarlo:**
```sql
-- Cambiar en la función handle_reservation_notifications_extended
-- Línea 4: v_admin_email TEXT := 'TU-EMAIL@gmail.com';
```

---

## 📊 **PASO 6: Monitorear el Sistema**

### **Ver Estadísticas:**
```sql
SELECT 
  template_name,
  status,
  COUNT(*) as cantidad
FROM email_logs 
GROUP BY template_name, status
ORDER BY template_name;
```

### **Ver Errores:**
```sql
SELECT 
  template_name,
  recipient_email,
  error_message,
  created_at
FROM email_logs 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### **Ver Conductores y Vehículos:**
```sql
SELECT 
  full_name,
  email,
  phone,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  vehicle_info->>'plate' as placa
FROM drivers
WHERE status = 'active';
```

---

## 🏗️ **PASO 7: Para Producción (Configurar Gmail)**

### **Cuando quieras usar Gmail en producción:**

1. **Ir a Supabase Dashboard → Settings → Auth**
2. **SMTP Settings:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `tu-email@gmail.com`
   - Password: `tu-app-password-de-16-digitos`

3. **Generar App Password en Gmail:**
   - Gmail → Configuración → Seguridad
   - Activar verificación en 2 pasos
   - Generar contraseña de aplicación

---

## 🎯 **PASO 8: Probar Flujo Completo**

### **Simular Flujo Real:**

1. **Crear una reserva** (en la app web)
2. **Confirmar como admin** (cambiar status a 'confirmed')
3. **Completar viaje** (cambiar status a 'completed')

```sql
-- Para simular manualmente:
-- 1. Buscar una reserva pendiente
UPDATE reservations 
SET status = 'confirmed' 
WHERE id = 'UUID-DE-RESERVA' 
AND status = 'pending';

-- 2. Esperar unos segundos y completar
UPDATE reservations 
SET status = 'completed' 
WHERE id = 'UUID-DE-RESERVA' 
AND status = 'confirmed';
```

---

## ⚠️ **Limitaciones del Email por Defecto de Supabase:**

- **3 correos por hora por proyecto**
- **Solo para desarrollo**
- **No personalizable**
- **Para producción usa Gmail**

---

## 🎉 **¡Sistema Completo!**

### **✅ Funcionalidades Implementadas:**
- 📧 Correos automáticos para clientes, conductores y admin
- 🚗 Notificaciones a conductores cuando se asigna viaje
- ✅ Confirmación de viaje completado
- 📊 Sistema de logs y monitoreo
- 🔧 Función de pruebas integrada
- 🔄 Triggers automáticos

### **🔥 Listo para usar:**
1. **Ejecuta los scripts**
2. **Prueba con tu email**
3. **¡Funciona inmediatamente!**

**¿Problemas?** Revisa los logs con:
```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
``` 