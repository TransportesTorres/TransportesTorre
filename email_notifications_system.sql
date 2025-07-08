-- SISTEMA DE NOTIFICACIONES POR CORREO PARA RESERVAS
-- Ejecutar este script en Supabase SQL Editor después de configurar SMTP

-- =============================================================================
-- 1. CREAR TABLA DE PLANTILLAS DE CORREO
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]', -- Variables disponibles para reemplazar
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================================================
-- 2. CREAR TABLA DE LOGS DE CORREOS ENVIADOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  recipient_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================================================
-- 3. INSERTAR PLANTILLAS DE CORREO
-- =============================================================================

-- Plantilla: Reserva Creada (para cliente)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'reservation_created',
  'Reserva Creada - Código: {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reserva Creada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; }
        .status { background: #fef3c7; color: #92400e; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Transportes Torres</h1>
        <h2>Reserva Recibida</h2>
    </div>
    
    <div class="content">
        <p>Estimado/a <strong>{{client_name}}</strong>,</p>
        
        <p>Hemos recibido tu solicitud de reserva. Un administrador la revisará pronto.</p>
        
        <div class="status">
            <strong>Estado:</strong> Pendiente de confirmación
        </div>
        
        <div class="info-box">
            <h3>📋 Detalles de tu Reserva</h3>
            <p><strong>Código de Confirmación:</strong> {{confirmation_code}}</p>
            <p><strong>Origen:</strong> {{pickup_location}}</p>
            <p><strong>Destino:</strong> {{dropoff_location}}</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
            <p><strong>Precio Total:</strong> ${{total_price}}</p>
            <p><strong>Teléfono de Contacto:</strong> {{contact_phone}}</p>
        </div>
        
        <div class="info-box">
            <h3>📞 ¿Necesitas Ayuda?</h3>
            <p>Si tienes preguntas sobre tu reserva, contáctanos:</p>
            <p><strong>WhatsApp:</strong> +56 9 1234 5678</p>
            <p><strong>Email:</strong> reservas@transportestorres.cl</p>
            <p><strong>Código de Referencia:</strong> {{confirmation_code}}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>© 2024 Transportes Torres SpA. Todos los derechos reservados.</p>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - Reserva Recibida

Estimado/a {{client_name}},

Hemos recibido tu solicitud de reserva con código {{confirmation_code}}.

DETALLES:
- Origen: {{pickup_location}}
- Destino: {{dropoff_location}}
- Pasajeros: {{passenger_count}}
- Precio: ${{total_price}}

Estado: Pendiente de confirmación

Contacto: +56 9 1234 5678
Email: reservas@transportestorres.cl

Transportes Torres SpA',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price", "contact_phone"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = TIMEZONE('utc'::text, NOW());

-- Plantilla: Reserva Confirmada (para cliente)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'reservation_confirmed',
  '✅ Reserva Confirmada - {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reserva Confirmada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; }
        .status { background: #d1fae5; color: #065f46; padding: 10px; border-radius: 5px; }
        .alert { background: #fef2f2; color: #991b1b; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Transportes Torres</h1>
        <h2>¡Reserva Confirmada!</h2>
    </div>
    
    <div class="content">
        <p>Estimado/a <strong>{{client_name}}</strong>,</p>
        
        <p>¡Excelente noticia! Tu reserva ha sido <strong>confirmada</strong>.</p>
        
        <div class="status">
            <strong>✅ Estado:</strong> Confirmada - Todo listo para tu viaje
        </div>
        
        <div class="info-box">
            <h3>📋 Detalles Confirmados</h3>
            <p><strong>Código:</strong> {{confirmation_code}}</p>
            <p><strong>Origen:</strong> {{pickup_location}}</p>
            <p><strong>Destino:</strong> {{dropoff_location}}</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
            <p><strong>Precio:</strong> ${{total_price}}</p>
        </div>
        
        <div class="alert">
            <h3>📱 Próximos Pasos</h3>
            <p>Nos comunicaremos contigo 24 horas antes del viaje para coordinar:</p>
            <ul>
                <li>Hora exacta de recogida</li>
                <li>Información del conductor</li>
                <li>Datos del vehículo</li>
                <li>Instrucciones especiales</li>
            </ul>
        </div>
        
        <div class="info-box">
            <h3>📞 Contacto</h3>
            <p><strong>WhatsApp:</strong> +56 9 1234 5678</p>
            <p><strong>Email:</strong> reservas@transportestorres.cl</p>
            <p><strong>Tu Código:</strong> {{confirmation_code}}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>¡Gracias por elegir Transportes Torres!</p>
        <p>© 2024 Transportes Torres SpA</p>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - ¡Reserva Confirmada!

Estimado/a {{client_name}},

¡Tu reserva {{confirmation_code}} ha sido CONFIRMADA!

DETALLES:
- Origen: {{pickup_location}}
- Destino: {{dropoff_location}}
- Pasajeros: {{passenger_count}}
- Precio: ${{total_price}}

Nos comunicaremos 24h antes del viaje.

Contacto: +56 9 1234 5678
Código: {{confirmation_code}}

¡Gracias por elegir Transportes Torres!',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = TIMEZONE('utc'::text, NOW());

-- Plantilla: Nueva Reserva (para admin)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'new_reservation_admin',
  '🚨 Nueva Reserva Pendiente - {{confirmation_code}} | Admin',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nueva Reserva</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; }
        .urgent { background: #fef2f2; color: #991b1b; padding: 10px; border-radius: 5px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ TRANSPORTES TORRES - ADMIN</h1>
        <h2>Nueva Reserva Pendiente</h2>
    </div>
    
    <div class="content">
        <div class="urgent">
            <strong>🚨 ACCIÓN REQUERIDA:</strong> Nueva reserva esperando confirmación
        </div>
        
        <div class="info-box">
            <h3>👤 Cliente</h3>
            <p><strong>Nombre:</strong> {{client_name}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            <p><strong>Teléfono:</strong> {{contact_phone}}</p>
        </div>
        
        <div class="info-box">
            <h3>🚗 Detalles del Viaje</h3>
            <p><strong>Código:</strong> {{confirmation_code}}</p>
            <p><strong>Ruta:</strong> {{pickup_location}} → {{dropoff_location}}</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
            <p><strong>Precio:</strong> ${{total_price}}</p>
            <p><strong>Vuelo:</strong> {{flight_number}}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="{{admin_dashboard_url}}" class="button">
                🔗 IR AL PANEL DE ADMIN
            </a>
        </div>
    </div>
    
    <div class="footer">
        <p>Panel de Administración - Transportes Torres</p>
    </div>
</body>
</html>',
  'ADMIN ALERT - Nueva Reserva Pendiente

Código: {{confirmation_code}}
Cliente: {{client_name}} ({{client_email}})
Teléfono: {{contact_phone}}

VIAJE:
{{pickup_location}} → {{dropoff_location}}
Pasajeros: {{passenger_count}}
Precio: ${{total_price}}

Revisar en: {{admin_dashboard_url}}',
  '["client_name", "client_email", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price", "contact_phone", "flight_number", "admin_dashboard_url"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = TIMEZONE('utc'::text, NOW());

-- =============================================================================
-- 4. FUNCIÓN PARA ENVIAR CORREOS
-- =============================================================================

CREATE OR REPLACE FUNCTION send_reservation_email(
  p_reservation_id UUID,
  p_template_name TEXT,
  p_recipient_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_template_record RECORD;
  v_reservation_record RECORD;
  v_client_record RECORD;
  v_subject TEXT;
  v_html_body TEXT;
  v_text_body TEXT;
  v_log_id UUID;
  v_admin_url TEXT := 'https://tu-dominio.vercel.app/dashboard/admin/reservations';
BEGIN
  -- Obtener plantilla
  SELECT * INTO v_template_record 
  FROM email_templates 
  WHERE template_name = p_template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plantilla de correo no encontrada: %', p_template_name;
  END IF;
  
  -- Obtener datos de la reserva
  SELECT r.*, p.full_name, p.email as client_email
  INTO v_reservation_record, v_client_record
  FROM reservations r
  JOIN profiles p ON r.user_id = p.id
  WHERE r.id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada: %', p_reservation_id;
  END IF;
  
  -- Reemplazar variables en subject
  v_subject := v_template_record.subject;
  v_subject := REPLACE(v_subject, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_subject := REPLACE(v_subject, '{{client_name}}', COALESCE(v_client_record.full_name, 'Cliente'));
  
  -- Reemplazar variables en HTML body
  v_html_body := v_template_record.html_body;
  v_html_body := REPLACE(v_html_body, '{{client_name}}', COALESCE(v_client_record.full_name, 'Cliente'));
  v_html_body := REPLACE(v_html_body, '{{client_email}}', COALESCE(v_client_record.client_email, ''));
  v_html_body := REPLACE(v_html_body, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_html_body := REPLACE(v_html_body, '{{pickup_location}}', v_reservation_record.pickup_location);
  v_html_body := REPLACE(v_html_body, '{{dropoff_location}}', v_reservation_record.dropoff_location);
  v_html_body := REPLACE(v_html_body, '{{passenger_count}}', v_reservation_record.passenger_count::TEXT);
  v_html_body := REPLACE(v_html_body, '{{total_price}}', TO_CHAR(v_reservation_record.total_price, 'FM999,999,999'));
  v_html_body := REPLACE(v_html_body, '{{contact_phone}}', COALESCE(v_reservation_record.contact_phone, ''));
  v_html_body := REPLACE(v_html_body, '{{flight_number}}', COALESCE(v_reservation_record.flight_number, 'No especificado'));
  v_html_body := REPLACE(v_html_body, '{{admin_dashboard_url}}', v_admin_url);
  
  -- Reemplazar variables en text body
  v_text_body := COALESCE(v_template_record.text_body, '');
  v_text_body := REPLACE(v_text_body, '{{client_name}}', COALESCE(v_client_record.full_name, 'Cliente'));
  v_text_body := REPLACE(v_text_body, '{{client_email}}', COALESCE(v_client_record.client_email, ''));
  v_text_body := REPLACE(v_text_body, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_text_body := REPLACE(v_text_body, '{{pickup_location}}', v_reservation_record.pickup_location);
  v_text_body := REPLACE(v_text_body, '{{dropoff_location}}', v_reservation_record.dropoff_location);
  v_text_body := REPLACE(v_text_body, '{{passenger_count}}', v_reservation_record.passenger_count::TEXT);
  v_text_body := REPLACE(v_text_body, '{{total_price}}', TO_CHAR(v_reservation_record.total_price, 'FM999,999,999'));
  v_text_body := REPLACE(v_text_body, '{{contact_phone}}', COALESCE(v_reservation_record.contact_phone, ''));
  v_text_body := REPLACE(v_text_body, '{{flight_number}}', COALESCE(v_reservation_record.flight_number, 'No especificado'));
  v_text_body := REPLACE(v_text_body, '{{admin_dashboard_url}}', v_admin_url);
  
  -- Crear log del correo
  INSERT INTO email_logs (reservation_id, recipient_email, template_name, subject, status)
  VALUES (p_reservation_id, p_recipient_email, p_template_name, v_subject, 'pending')
  RETURNING id INTO v_log_id;
  
  -- Intentar enviar el correo usando Supabase Auth
  BEGIN
    PERFORM auth.send_email(
      p_recipient_email,
      v_subject,
      v_html_body,
      v_text_body
    );
    
    -- Actualizar log como enviado
    UPDATE email_logs 
    SET status = 'sent', sent_at = NOW() 
    WHERE id = v_log_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Actualizar log como fallido
    UPDATE email_logs 
    SET status = 'failed', error_message = SQLERRM 
    WHERE id = v_log_id;
    
    RAISE NOTICE 'Error enviando correo: %', SQLERRM;
  END;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. TRIGGERS PARA ENVÍO AUTOMÁTICO
-- =============================================================================

-- Función para manejar cambios en reservas
CREATE OR REPLACE FUNCTION handle_reservation_email_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email TEXT := 'admin@transportestorres.cl'; -- CAMBIAR POR TU EMAIL DE ADMIN
  v_client_email TEXT;
BEGIN
  -- Obtener email del cliente
  SELECT email INTO v_client_email 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  -- Si es una nueva reserva
  IF TG_OP = 'INSERT' THEN
    -- Enviar correo al cliente
    PERFORM send_reservation_email(NEW.id, 'reservation_created', v_client_email);
    
    -- Enviar notificación al admin
    PERFORM send_reservation_email(NEW.id, 'new_reservation_admin', v_admin_email);
    
  -- Si es una actualización de estado
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    -- Si la reserva fue confirmada
    IF NEW.status = 'confirmed' THEN
      PERFORM send_reservation_email(NEW.id, 'reservation_confirmed', v_client_email);
    END IF;
    
    -- Agregar más casos según necesites (cancelled, in_progress, completed)
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS reservation_email_trigger ON reservations;
CREATE TRIGGER reservation_email_trigger
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION handle_reservation_email_notifications();

-- =============================================================================
-- 6. FUNCIÓN MANUAL PARA ENVIAR CORREOS (OPCIONAL)
-- =============================================================================

CREATE OR REPLACE FUNCTION send_manual_email(
  p_reservation_id UUID,
  p_template_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_client_email TEXT;
  v_log_id UUID;
BEGIN
  -- Obtener email del cliente
  SELECT p.email INTO v_client_email 
  FROM reservations r
  JOIN profiles p ON r.user_id = p.id
  WHERE r.id = p_reservation_id;
  
  IF v_client_email IS NULL THEN
    RETURN 'Error: No se encontró el email del cliente';
  END IF;
  
  -- Enviar correo
  v_log_id := send_reservation_email(p_reservation_id, p_template_name, v_client_email);
  
  RETURN 'Correo enviado. Log ID: ' || v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. VERIFICACIÓN FINAL
-- =============================================================================

SELECT 'Sistema de correos configurado exitosamente' as status;

-- Verificar plantillas
SELECT 'Plantillas disponibles:' as info;
SELECT template_name, subject FROM email_templates WHERE is_active = true;

-- Verificar triggers
SELECT 'Triggers configurados:' as info;
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'reservations' 
AND trigger_name LIKE '%email%';

SELECT '¡Listo! Ahora configura SMTP en Supabase y cambia el email de admin en el script.' as final_note; 