# ✅ Checklist de Configuración Supabase

## 🚨 PROBLEMA COMÚN: Email redirige a página incorrecta

### ❌ **Error**: Botón de "Resetear Contraseña" redirige a `/auth/confirm`
### ✅ **Solución**: Verificar que estés editando el template correcto

---

## 📧 **1. Email Templates - VERIFICAR TEMPLATE CORRECTO**

### 🔴 **CRÍTICO**: Hay 3 templates diferentes en Supabase:

1. **Confirm signup** (Confirmación de cuenta)
   - Redirige a: `/auth/confirm`
   - Usa: `supabase_email_template.html` (que ya tienes)

2. **Reset password** (Recuperación de contraseña) 
   - Redirige a: `/auth/reset-password`
   - Debe usar: `supabase_reset_password_template.html`

3. **Magic Link** (Login sin contraseña)
   - No aplica para este proyecto

### ✅ **Pasos para corregir:**

1. Ve a **Supabase Dashboard** → **Authentication** → **Email Templates**
2. **IMPORTANTE**: Selecciona **"Reset password"** en el dropdown
3. Copia y pega el contenido de `supabase_reset_password_template.html`
4. **Subject**: `Restablece tu contraseña - Transportes Torres`
5. Guardar cambios

---

## 🔗 **2. URL Configuration**

### En **Authentication** → **URL Configuration**:

**Site URL:**
```
http://localhost:3000
```
(Para producción: tu dominio de Vercel)

**Redirect URLs:**
```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
https://tu-dominio.vercel.app/auth/confirm
https://tu-dominio.vercel.app/auth/reset-password
```

---

## 🧪 **3. Cómo Probar que está Funcionando**

### **Test de Confirmación de Cuenta:**
1. Registra un nuevo usuario
2. Revisa el correo → Botón debe llevar a `/auth/confirm`
3. Al hacer clic → Debe confirmar cuenta y redirigir al login

### **Test de Recuperación de Contraseña:**
1. En login, haz clic "¿Olvidaste tu contraseña?"
2. Ingresa email de usuario registrado
3. Revisa el correo → Botón debe llevar a `/auth/reset-password`
4. Al hacer clic → Debe mostrar formulario para nueva contraseña

---

## 🚨 **4. Diagnóstico de Problemas**

### **Si el botón de reset redirige a `/auth/confirm`:**
- ❌ Estás editando el template incorrecto
- ✅ Ve a "Reset password" template en Supabase

### **Si aparece error "Invalid link":**
- ❌ Redirect URLs no están configuradas
- ✅ Agrega las URLs correctas en Supabase

### **Si no llega el correo:**
- ❌ SMTP no configurado
- ✅ Configura SMTP en Supabase (Authentication → Settings → SMTP)

---

## 📝 **5. Templates Correctos por Funcionalidad**

| Funcionalidad | Template Supabase | Archivo Local | URL Destino |
|---------------|------------------|---------------|-------------|
| Registro nuevo usuario | **Confirm signup** | `supabase_email_template.html` | `/auth/confirm` |
| Recuperar contraseña | **Reset password** | `supabase_reset_password_template.html` | `/auth/reset-password` |

---

## 🔍 **6. Verificación Rápida**

**Para confirmar que está bien configurado:**

1. **Prueba registro**: El email debe tener botón que diga "Confirmar mi cuenta"
2. **Prueba reset**: El email debe tener botón que diga "Restablecer mi contraseña" 
3. **URLs diferentes**: Los botones deben llevar a páginas diferentes

---

## ⚡ **7. Solución Rápida si sigues teniendo problemas**

Si después de verificar todo sigue fallando:

1. **Borra el template actual** en "Reset password"
2. **Copia nuevamente** el contenido de `supabase_reset_password_template.html`
3. **Verifica el Subject**: `Restablece tu contraseña - Transportes Torres`
4. **Guarda** y prueba nuevamente

---

**¡El template está listo! Solo necesita estar en el lugar correcto de Supabase.** 🎯 