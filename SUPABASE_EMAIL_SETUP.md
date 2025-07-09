# Configuración de Email de Confirmación en Supabase

## Página de Confirmación Creada

Se ha creado una página simple de confirmación de cuenta en `/auth/confirm` que muestra un mensaje de éxito y un enlace para ir al login.

**Ubicación:** `src/app/auth/confirm/page.tsx`

## Configuración en Supabase

Para que Supabase redireccione automáticamente a esta página después de la confirmación de email:

### 1. Acceder a la Configuración de Authentication

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** > **Settings**
3. Busca la sección **URL Configuration**

### 2. Configurar Site URL

En el campo **Site URL**, asegúrate de que esté configurado como:
```
https://tu-dominio.com
```

Para desarrollo local:
```
http://localhost:3000
```

### 3. Configurar Redirect URLs

En el campo **Redirect URLs**, agrega las siguientes URLs:

**Para producción:**
```
https://tu-dominio.com/auth/confirm
https://tu-dominio.com/auth
https://tu-dominio.com/dashboard
```

**Para desarrollo:**
```
http://localhost:3000/auth/confirm
http://localhost:3000/auth
http://localhost:3000/dashboard
```

### 4. Configurar Email Templates

1. Ve a **Authentication** > **Email Templates**
2. Selecciona **Confirm signup**
3. En el template, asegúrate de que el enlace de confirmación sea:
   ```
   <a href="{{ .SiteURL }}/auth/confirm">Confirmar cuenta</a>
   ```

## Flujo de Confirmación

1. **Usuario se registra:** Completa el formulario de registro
2. **Email enviado:** Supabase envía un email con un enlace de confirmación
3. **Usuario hace clic:** El enlace confirma la cuenta automáticamente y redirige a `/auth/confirm`
4. **Página de éxito:** Muestra mensaje de confirmación exitosa
5. **Usuario va al login:** Hace clic en el botón para ir al login

## Página de Confirmación

La página es muy simple y solo muestra:

- ✅ Mensaje de confirmación exitosa
- 🔗 Botón para ir al login
- 📧 Enlace de contacto para soporte

## URL de Confirmación para Supabase

**URL principal para configurar en Supabase:**
```
https://tu-dominio.com/auth/confirm
```

## Ejemplo de Configuración Completa

```json
{
  "SITE_URL": "https://tu-dominio.com",
  "REDIRECT_URLS": [
    "https://tu-dominio.com/auth/confirm",
    "https://tu-dominio.com/auth",
    "https://tu-dominio.com/dashboard"
  ]
}
```

## Notas Importantes

- Supabase se encarga automáticamente de la confirmación
- La página solo muestra el mensaje de éxito
- No requiere procesamiento adicional de tokens
- Es completamente responsiva y sigue el diseño de la aplicación

## Verificación

Para verificar que todo funciona correctamente:

1. Registra un nuevo usuario
2. Revisa que llegue el email de confirmación
3. Haz clic en el enlace del email
4. Verifica que aparezca la página de confirmación
5. Haz clic en "Iniciar Sesión" para ir al login

¡La configuración está completa! 🎉 