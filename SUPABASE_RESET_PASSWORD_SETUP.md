# Configuración de Recuperación de Contraseña en Supabase

## 📧 Template de Correo para Recuperación de Contraseña

### Paso 1: Acceder a la Configuración de Email Templates

1. Ve a tu proyecto de Supabase Dashboard
2. Navega a **Authentication** > **Email Templates**
3. Selecciona **Reset Password** en la lista de templates

### Paso 2: Configurar el Template

#### Subject (Asunto del correo):
```
Restablece tu contraseña - Transportes Torres
```

#### HTML Template:
Copia y pega el contenido del archivo `supabase_reset_password_template.html` en el editor HTML de Supabase.

### Paso 3: Configurar la URL de Redirección

En la configuración de Authentication, asegúrate de que la **Site URL** esté configurada correctamente:

```
Site URL: https://tu-dominio.com
```

O para desarrollo local:
```
Site URL: http://localhost:3000
```

### Paso 4: Configurar Redirect URLs

En **Redirect URLs**, agrega:
```
http://localhost:3000/auth/reset-password
https://tu-dominio.com/auth/reset-password
```

## 🔧 Variables Disponibles en el Template

Supabase proporciona estas variables que puedes usar en tu template:

- `{{ .ConfirmationURL }}` - URL para restablecer la contraseña
- `{{ .SiteURL }}` - URL base de tu sitio
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de confirmación (no recomendado mostrarlo)

## 🚀 Funcionalidades Implementadas

### Frontend:
- ✅ Formulario de solicitud de recuperación (`ForgotPasswordForm`)
- ✅ Formulario de restablecimiento (`ResetPasswordForm`)
- ✅ Página de restablecimiento (`/auth/reset-password`)
- ✅ Integración con AuthContainer
- ✅ Validación de contraseña segura
- ✅ Estados de éxito y error
- ✅ Animaciones y UI moderna

### Backend (Supabase):
- ✅ Función `resetPassword` en authSlice
- ✅ Función `updatePassword` en authSlice
- ✅ Manejo de sesiones de recuperación
- ✅ Verificación de tokens de acceso

## 📱 Flujo de Usuario

1. **Usuario olvida su contraseña**:
   - Hace clic en "¿Olvidaste tu contraseña?" en el login
   - Se muestra el formulario de recuperación

2. **Solicita recuperación**:
   - Ingresa su email
   - Sistema envía correo con enlace

3. **Usuario recibe correo**:
   - Correo con diseño profesional
   - Botón claro para restablecer
   - Información de seguridad

4. **Usuario hace clic en enlace**:
   - Es redirigido a `/auth/reset-password`
   - Sistema valida el token automáticamente

5. **Usuario establece nueva contraseña**:
   - Formulario con validación en tiempo real
   - Requisitos de seguridad visibles
   - Confirmación de contraseña

6. **Éxito**:
   - Mensaje de confirmación
   - Redirección automática al dashboard

## 🔒 Características de Seguridad

- **Expiración de enlaces**: Los enlaces expiran en 1 hora
- **Uso único**: Cada enlace solo funciona una vez
- **Validación de contraseña**: Requisitos de seguridad estrictos
- **Verificación de sesión**: Validación de tokens en el frontend
- **Manejo de errores**: Mensajes claros para enlaces inválidos

## 🎨 Personalización del Template

El template incluye:
- **Diseño responsive**: Se adapta a móviles y desktop
- **Modo oscuro**: Soporte automático para dark mode
- **Colores de marca**: Rojo/rosa para diferenciarlo del registro
- **Iconos informativos**: Emojis para mejor UX
- **Consejos de seguridad**: Educación al usuario
- **Footer profesional**: Información de contacto

## 🧪 Testing

Para probar la funcionalidad:

1. **Desarrollo local**:
   ```bash
   npm run dev
   ```

2. **Probar flujo completo**:
   - Ve a `http://localhost:3000/auth`
   - Haz clic en "¿Olvidaste tu contraseña?"
   - Ingresa un email válido registrado
   - Revisa tu bandeja de entrada
   - Haz clic en el enlace del correo
   - Establece nueva contraseña

3. **Casos de prueba**:
   - ✅ Email válido registrado
   - ✅ Email no registrado
   - ✅ Enlace expirado
   - ✅ Enlace ya usado
   - ✅ Contraseña débil
   - ✅ Contraseñas no coinciden

## 📞 Soporte

Si tienes problemas:
1. Verifica la configuración de SMTP en Supabase
2. Revisa los logs de Authentication en Supabase
3. Confirma que las redirect URLs estén correctas
4. Verifica que el template esté guardado correctamente

---

**¡La funcionalidad de recuperación de contraseña está lista para usar!** 🎉 