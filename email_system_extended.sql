-- EXTENSIÓN DEL SISTEMA DE CORREOS - CONDUCTORES Y VIAJES COMPLETADOS
-- Ejecutar DESPUÉS del script email_notifications_system.sql

-- =============================================================================
-- 1. PLANTILLAS ADICIONALES
-- =============================================================================

-- Plantilla: Viaje Asignado (para conductor)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'trip_assigned_driver',
  '🚗 Nuevo Viaje Asignado - {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .status { background: #dbeafe; color: #1e40af; padding: 10px; border-radius: 5px; }
        .client-info { background: #fef3c7; color: #92400e; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Transportes Torres</h1>
        <h2>Nuevo Viaje Asignado</h2>
    </div>
    
    <div class="content">
        <p>Estimado conductor <strong>{{driver_name}}</strong>,</p>
        
        <p>Se te ha asignado un nuevo viaje confirmado.</p>
        
        <div class="status">
            <strong>📋 Código de Reserva:</strong> {{confirmation_code}}
        </div>
        
        <div class="info-box">
            <h3>🗺️ Detalles del Viaje</h3>
            <p><strong>Origen:</strong> {{pickup_location}}</p>
            <p><strong>Destino:</strong> {{dropoff_location}}</p>
            <p><strong>Fecha:</strong> {{departure_date}}</p>
            <p><strong>Hora:</strong> {{departure_time}}</p>
            <p><strong>Duración estimada:</strong> {{duration}} minutos</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
        </div>
        
        <div class="client-info">
            <h3>👤 Información del Cliente</h3>
            <p><strong>Nombre:</strong> {{client_name}}</p>
            <p><strong>Teléfono:</strong> {{contact_phone}}</p>
            <p><strong>Vuelo:</strong> {{flight_number}}</p>
            <p><strong>Instrucciones:</strong> {{special_requirements}}</p>
        </div>
        
        <div class="info-box">
            <h3>📱 Importante</h3>
            <ul>
                <li>Contacta al cliente 30 min antes</li>
                <li>Confirma la ubicación exacta</li>
                <li>Llega 10 minutos antes</li>
                <li>Marca el viaje como "En progreso" al iniciar</li>
                <li>Marca como "Completado" al finalizar</li>
            </ul>
        </div>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - Nuevo Viaje Asignado

Conductor: {{driver_name}}
Código: {{confirmation_code}}

VIAJE:
{{pickup_location}} → {{dropoff_location}}
Fecha: {{departure_date}} {{departure_time}}
Pasajeros: {{passenger_count}}

CLIENTE:
{{client_name}} - {{contact_phone}}
Vuelo: {{flight_number}}

INSTRUCCIONES:
- Contactar 30 min antes
- Llegar 10 min antes
- Marcar estados en la app

Transportes Torres',
  '["driver_name", "confirmation_code", "pickup_location", "dropoff_location", "departure_date", "departure_time", "duration", "passenger_count", "client_name", "contact_phone", "flight_number", "special_requirements"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = TIMEZONE('utc'::text, NOW());

-- Plantilla: Viaje Completado (para cliente)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'trip_completed',
  '✅ Viaje Completado - {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .success { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; }
        .rating { background: #fffbeb; color: #92400e; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Transportes Torres</h1>
        <h2>¡Viaje Completado Exitosamente!</h2>
    </div>
    
    <div class="content">
        <p>Estimado/a <strong>{{client_name}}</strong>,</p>
        
        <div class="success">
            <h3>✅ ¡Tu viaje se ha completado exitosamente!</h3>
            <p>Esperamos que hayas tenido una excelente experiencia con nosotros.</p>
        </div>
        
        <div class="info-box">
            <h3>📋 Resumen del Viaje</h3>
            <p><strong>Código:</strong> {{confirmation_code}}</p>
            <p><strong>Ruta:</strong> {{pickup_location}} → {{dropoff_location}}</p>
            <p><strong>Conductor:</strong> {{driver_name}}</p>
            <p><strong>Vehículo:</strong> {{vehicle_info}}</p>
            <p><strong>Fecha:</strong> {{completion_date}}</p>
            <p><strong>Precio:</strong> ${{total_price}}</p>
        </div>
        
        <div class="rating">
            <h3>⭐ ¿Qué te pareció el servicio?</h3>
            <p>Tu opinión es muy importante para nosotros.</p>
            <p>Nos encantaría conocer tu experiencia para seguir mejorando.</p>
            <p><strong>Contacto:</strong> +56 9 1234 5678</p>
            <p><strong>Email:</strong> feedback@transportestorres.cl</p>
        </div>
        
        <div class="info-box">
            <h3>🎉 ¡Gracias por elegir Transportes Torres!</h3>
            <p>Esperamos verte pronto en tu próximo viaje.</p>
            <p>Para futuras reservas: reservas@transportestorres.cl</p>
        </div>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - ¡Viaje Completado!

{{client_name}}, tu viaje se completó exitosamente.

RESUMEN:
Código: {{confirmation_code}}
Ruta: {{pickup_location}} → {{dropoff_location}}
Conductor: {{driver_name}}
Precio: ${{total_price}}

¡Gracias por elegir Transportes Torres!

Feedback: feedback@transportestorres.cl
Nuevas reservas: reservas@transportestorres.cl',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "driver_name", "vehicle_info", "completion_date", "total_price"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = TIMEZONE('utc'::text, NOW());

-- =============================================================================
-- 2. FUNCIÓN EXTENDIDA PARA ENVIAR CORREOS (INCLUYE CONDUCTORES)
-- =============================================================================

CREATE OR REPLACE FUNCTION send_reservation_email_extended(
  p_reservation_id UUID,
  p_template_name TEXT,
  p_recipient_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_template_record RECORD;
  v_reservation_record RECORD;
  v_client_record RECORD;
  v_trip_record RECORD;
  v_driver_record RECORD;
  v_subject TEXT;
  v_html_body TEXT;
  v_text_body TEXT;
  v_log_id UUID;
BEGIN
  -- Obtener plantilla
  SELECT * INTO v_template_record 
  FROM email_templates 
  WHERE template_name = p_template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plantilla no encontrada: %', p_template_name;
  END IF;
  
  -- Obtener datos completos
  SELECT 
    r.*,
    p.full_name as client_name, 
    p.email as client_email,
    t.*,
    d.full_name as driver_name,
    d.email as driver_email,
    d.vehicle_info
  INTO v_reservation_record, v_client_record, v_trip_record, v_driver_record
  FROM reservations r
  JOIN profiles p ON r.user_id = p.id
  LEFT JOIN trips t ON r.trip_id = t.id
  LEFT JOIN drivers d ON t.driver_id = d.id
  WHERE r.id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada: %', p_reservation_id;
  END IF;
  
  -- Inicializar textos
  v_subject := v_template_record.subject;
  v_html_body := v_template_record.html_body;
  v_text_body := COALESCE(v_template_record.text_body, '');
  
  -- Reemplazar variables básicas
  v_subject := REPLACE(v_subject, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_subject := REPLACE(v_subject, '{{client_name}}', COALESCE(v_client_record.client_name, 'Cliente'));
  
  -- Reemplazar en HTML
  v_html_body := REPLACE(v_html_body, '{{client_name}}', COALESCE(v_client_record.client_name, 'Cliente'));
  v_html_body := REPLACE(v_html_body, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_html_body := REPLACE(v_html_body, '{{pickup_location}}', v_reservation_record.pickup_location);
  v_html_body := REPLACE(v_html_body, '{{dropoff_location}}', v_reservation_record.dropoff_location);
  v_html_body := REPLACE(v_html_body, '{{passenger_count}}', v_reservation_record.passenger_count::TEXT);
  v_html_body := REPLACE(v_html_body, '{{total_price}}', TO_CHAR(v_reservation_record.total_price, 'FM999,999,999'));
  v_html_body := REPLACE(v_html_body, '{{contact_phone}}', COALESCE(v_reservation_record.contact_phone, ''));
  v_html_body := REPLACE(v_html_body, '{{flight_number}}', COALESCE(v_reservation_record.flight_number, 'No especificado'));
  v_html_body := REPLACE(v_html_body, '{{special_requirements}}', COALESCE(v_reservation_record.special_requirements, 'Ninguna'));
  
  -- Variables específicas para conductores
  IF v_driver_record.driver_name IS NOT NULL THEN
    v_html_body := REPLACE(v_html_body, '{{driver_name}}', v_driver_record.driver_name);
    v_html_body := REPLACE(v_html_body, '{{vehicle_info}}', COALESCE(v_driver_record.vehicle_info->>'brand' || ' ' || v_driver_record.vehicle_info->>'model', 'Vehículo asignado'));
  END IF;
  
  -- Variables de fecha/hora
  IF v_trip_record.departure_time IS NOT NULL THEN
    v_html_body := REPLACE(v_html_body, '{{departure_date}}', TO_CHAR(v_trip_record.departure_time, 'DD/MM/YYYY'));
    v_html_body := REPLACE(v_html_body, '{{departure_time}}', TO_CHAR(v_trip_record.departure_time, 'HH24:MI'));
    v_html_body := REPLACE(v_html_body, '{{duration}}', COALESCE(v_trip_record.estimated_duration::TEXT, '60'));
  END IF;
  
  v_html_body := REPLACE(v_html_body, '{{completion_date}}', TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI'));
  
  -- Reemplazar en texto plano (mismas variables)
  v_text_body := REPLACE(v_text_body, '{{client_name}}', COALESCE(v_client_record.client_name, 'Cliente'));
  v_text_body := REPLACE(v_text_body, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_text_body := REPLACE(v_text_body, '{{pickup_location}}', v_reservation_record.pickup_location);
  v_text_body := REPLACE(v_text_body, '{{dropoff_location}}', v_reservation_record.dropoff_location);
  v_text_body := REPLACE(v_text_body, '{{passenger_count}}', v_reservation_record.passenger_count::TEXT);
  v_text_body := REPLACE(v_text_body, '{{total_price}}', TO_CHAR(v_reservation_record.total_price, 'FM999,999,999'));
  v_text_body := REPLACE(v_text_body, '{{contact_phone}}', COALESCE(v_reservation_record.contact_phone, ''));
  v_text_body := REPLACE(v_text_body, '{{driver_name}}', COALESCE(v_driver_record.driver_name, 'Conductor asignado'));
  
  -- Crear log
  INSERT INTO email_logs (reservation_id, recipient_email, template_name, subject, status)
  VALUES (p_reservation_id, p_recipient_email, p_template_name, v_subject, 'pending')
  RETURNING id INTO v_log_id;
  
  -- Enviar correo
  BEGIN
    PERFORM auth.send_email(
      p_recipient_email,
      v_subject,
      v_html_body,
      v_text_body
    );
    
    UPDATE email_logs 
    SET status = 'sent', sent_at = NOW() 
    WHERE id = v_log_id;
    
  EXCEPTION WHEN OTHERS THEN
    UPDATE email_logs 
    SET status = 'failed', error_message = SQLERRM 
    WHERE id = v_log_id;
  END;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. TRIGGER EXTENDIDO PARA MANEJAR TODOS LOS CASOS
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_reservation_notifications_extended()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email TEXT := 'admin@transportestorres.cl'; -- CAMBIAR POR TU EMAIL
  v_client_email TEXT;
  v_driver_email TEXT;
BEGIN
  -- Obtener emails
  SELECT p.email INTO v_client_email 
  FROM profiles p 
  WHERE p.id = NEW.user_id;
  
  SELECT d.email INTO v_driver_email
  FROM trips t
  JOIN drivers d ON t.driver_id = d.id
  WHERE t.id = NEW.trip_id;
  
  -- Nueva reserva
  IF TG_OP = 'INSERT' THEN
    PERFORM send_reservation_email_extended(NEW.id, 'reservation_created', v_client_email);
    PERFORM send_reservation_email_extended(NEW.id, 'new_reservation_admin', v_admin_email);
    
  -- Cambio de estado
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    IF NEW.status = 'confirmed' THEN
      -- Cliente: reserva confirmada
      PERFORM send_reservation_email_extended(NEW.id, 'reservation_confirmed', v_client_email);
      
      -- Conductor: viaje asignado
      IF v_driver_email IS NOT NULL THEN
        PERFORM send_reservation_email_extended(NEW.id, 'trip_assigned_driver', v_driver_email);
      END IF;
      
    ELSIF NEW.status = 'completed' THEN
      -- Cliente: viaje completado
      PERFORM send_reservation_email_extended(NEW.id, 'trip_completed', v_client_email);
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reemplazar trigger anterior
DROP TRIGGER IF EXISTS reservation_email_trigger ON reservations;
CREATE TRIGGER reservation_email_trigger
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION handle_reservation_notifications_extended();

-- =============================================================================
-- 4. FUNCIÓN DE PRUEBA
-- =============================================================================

CREATE OR REPLACE FUNCTION test_email_system()
RETURNS TEXT AS $$
DECLARE
  v_test_reservation_id UUID;
  v_result TEXT;
BEGIN
  -- Buscar una reserva existente para probar
  SELECT id INTO v_test_reservation_id 
  FROM reservations 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_test_reservation_id IS NULL THEN
    RETURN 'No hay reservas para probar. Crea una reserva primero.';
  END IF;
  
  -- Enviar correo de prueba
  PERFORM send_reservation_email_extended(
    v_test_reservation_id, 
    'reservation_created', 
    'test@example.com'
  );
  
  RETURN 'Correo de prueba enviado para reserva: ' || v_test_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

SELECT 'Sistema de correos extendido configurado' as status;

SELECT 'Plantillas disponibles:' as info;
SELECT template_name, subject FROM email_templates ORDER BY template_name;

SELECT 'Para probar: SELECT test_email_system();' as test_command; 