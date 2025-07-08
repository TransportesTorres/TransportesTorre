-- ===================================================================
-- SISTEMA COMPLETO DE CORREOS - TRANSPORTES TORRES
-- ===================================================================
-- Ejecutar este script ÚNICO en Supabase SQL Editor
-- Incluye: Tablas base + Conductores + Correos extendidos + Pruebas
-- ===================================================================

-- =============================================================================
-- 1. CREAR TABLAS BASE DEL SISTEMA DE CORREOS
-- =============================================================================

-- Tabla de plantillas de correo
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de correos enviados
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  recipient_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. CREAR TABLA DE CONDUCTORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  license_number TEXT UNIQUE NOT NULL,
  vehicle_info JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_trip')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para conductores
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Agregar columna driver_id a trips si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN driver_id UUID REFERENCES drivers(id);
    CREATE INDEX idx_trips_driver_id ON trips(driver_id);
  END IF;
END $$;

-- =============================================================================
-- 3. DATOS DE EJEMPLO - CONDUCTORES
-- =============================================================================

INSERT INTO drivers (full_name, email, phone, license_number, vehicle_info, status) VALUES
(
  'Carlos Mendoza',
  'carlos.mendoza@transportestorres.cl',
  '+56 9 8765 4321',
  'LIC-001-2024',
  '{
    "brand": "Toyota",
    "model": "Hiace",
    "year": 2022,
    "color": "Blanco",
    "plate": "HJKL-98",
    "capacity": 15,
    "features": ["Aire acondicionado", "WiFi", "Puerto USB"]
  }',
  'active'
),
(
  'María González',
  'maria.gonzalez@transportestorres.cl',
  '+56 9 7654 3210',
  'LIC-002-2024',
  '{
    "brand": "Mercedes",
    "model": "Sprinter",
    "year": 2023,
    "color": "Azul",
    "plate": "MNOP-76",
    "capacity": 20,
    "features": ["Aire acondicionado", "TV", "Refrigerador"]
  }',
  'active'
),
(
  'Roberto Silva',
  'roberto.silva@transportestorres.cl',
  '+56 9 6543 2109',
  'LIC-003-2024',
  '{
    "brand": "Ford",
    "model": "Transit",
    "year": 2021,
    "color": "Gris",
    "plate": "QRST-54",
    "capacity": 12,
    "features": ["Aire acondicionado", "Sistema de audio"]
  }',
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Asignar conductores a viajes existentes
UPDATE trips 
SET driver_id = (
  SELECT id FROM drivers 
  WHERE status = 'active' 
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE driver_id IS NULL;

-- =============================================================================
-- 4. PLANTILLAS DE CORREO COMPLETAS
-- =============================================================================

-- Plantilla: Reserva Creada (para cliente)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'reservation_created',
  'Reserva Creada - Código: {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
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
            <p><strong>Código:</strong> {{confirmation_code}}</p>
            <p><strong>Origen:</strong> {{pickup_location}}</p>
            <p><strong>Destino:</strong> {{dropoff_location}}</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
            <p><strong>Precio:</strong> ${{total_price}}</p>
            <p><strong>Teléfono:</strong> {{contact_phone}}</p>
        </div>
        
        <div class="info-box">
            <h3>📞 ¿Necesitas Ayuda?</h3>
            <p>WhatsApp: +56 9 1234 5678</p>
            <p>Email: reservas@transportestorres.cl</p>
            <p>Código: {{confirmation_code}}</p>
        </div>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - Reserva Recibida

{{client_name}}, hemos recibido tu reserva {{confirmation_code}}.

DETALLES:
- Origen: {{pickup_location}}
- Destino: {{dropoff_location}}
- Pasajeros: {{passenger_count}}
- Precio: ${{total_price}}

Estado: Pendiente de confirmación

Contacto: +56 9 1234 5678
Transportes Torres SpA',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price", "contact_phone"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Plantilla: Reserva Confirmada (para cliente)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'reservation_confirmed',
  '✅ Reserva Confirmada - {{confirmation_code}} | Transportes Torres',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
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
            <p>WhatsApp: +56 9 1234 5678</p>
            <p>Email: reservas@transportestorres.cl</p>
            <p>Tu Código: {{confirmation_code}}</p>
        </div>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - ¡Reserva Confirmada!

{{client_name}}, tu reserva {{confirmation_code}} está CONFIRMADA!

DETALLES:
- Origen: {{pickup_location}}
- Destino: {{dropoff_location}}
- Pasajeros: {{passenger_count}}
- Precio: ${{total_price}}

Nos comunicaremos 24h antes del viaje.

Contacto: +56 9 1234 5678
Transportes Torres SpA',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Plantilla: Nueva Reserva (para admin)
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables) VALUES (
  'new_reservation_admin',
  '🔔 Nueva Reserva Pendiente - {{confirmation_code}} | Admin',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .urgent { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Transportes Torres - Admin</h1>
        <h2>Nueva Reserva Pendiente</h2>
    </div>
    
    <div class="content">
        <div class="urgent">
            <h3>⚠️ ACCIÓN REQUERIDA</h3>
            <p>Nueva reserva pendiente de confirmación.</p>
        </div>
        
        <div class="info-box">
            <h3>📋 Detalles de la Reserva</h3>
            <p><strong>Código:</strong> {{confirmation_code}}</p>
            <p><strong>Cliente:</strong> {{client_name}}</p>
            <p><strong>Origen:</strong> {{pickup_location}}</p>
            <p><strong>Destino:</strong> {{dropoff_location}}</p>
            <p><strong>Pasajeros:</strong> {{passenger_count}}</p>
            <p><strong>Precio:</strong> ${{total_price}}</p>
            <p><strong>Teléfono:</strong> {{contact_phone}}</p>
        </div>
        
        <div class="info-box">
            <h3>🔧 Acciones Necesarias</h3>
            <p>1. Revisar disponibilidad</p>
            <p>2. Confirmar o rechazar reserva</p>
            <p>3. Asignar conductor si es necesario</p>
            <p>4. Coordinar detalles del viaje</p>
        </div>
    </div>
</body>
</html>',
  'TRANSPORTES TORRES - Nueva Reserva Pendiente

CÓDIGO: {{confirmation_code}}
CLIENTE: {{client_name}}

DETALLES:
- Origen: {{pickup_location}}
- Destino: {{dropoff_location}}
- Pasajeros: {{passenger_count}}
- Precio: ${{total_price}}
- Teléfono: {{contact_phone}}

ACCIÓN REQUERIDA: Confirmar o rechazar reserva

Admin Dashboard: /dashboard/admin/reservations',
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "total_price", "contact_phone"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

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
Pasajeros: {{passenger_count}}

CLIENTE:
{{client_name}} - {{contact_phone}}
Vuelo: {{flight_number}}

INSTRUCCIONES:
- Contactar 30 min antes
- Llegar 10 min antes
- Marcar estados en la app

Transportes Torres',
  '["driver_name", "confirmation_code", "pickup_location", "dropoff_location", "passenger_count", "client_name", "contact_phone", "flight_number", "special_requirements"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

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
  '["client_name", "confirmation_code", "pickup_location", "dropoff_location", "driver_name", "total_price"]'
) ON CONFLICT (template_name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================================================
-- 5. FUNCIÓN PARA ENVIAR CORREOS (VERSIÓN EXTENDIDA)
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
    d.email as driver_email
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
  END IF;
  
  -- Reemplazar en texto plano (mismas variables)
  v_text_body := REPLACE(v_text_body, '{{client_name}}', COALESCE(v_client_record.client_name, 'Cliente'));
  v_text_body := REPLACE(v_text_body, '{{confirmation_code}}', v_reservation_record.confirmation_code);
  v_text_body := REPLACE(v_text_body, '{{pickup_location}}', v_reservation_record.pickup_location);
  v_text_body := REPLACE(v_text_body, '{{dropoff_location}}', v_reservation_record.dropoff_location);
  v_text_body := REPLACE(v_text_body, '{{passenger_count}}', v_reservation_record.passenger_count::TEXT);
  v_text_body := REPLACE(v_text_body, '{{total_price}}', TO_CHAR(v_reservation_record.total_price, 'FM999,999,999'));
  v_text_body := REPLACE(v_text_body, '{{contact_phone}}', COALESCE(v_reservation_record.contact_phone, ''));
  v_text_body := REPLACE(v_text_body, '{{driver_name}}', COALESCE(v_driver_record.driver_name, 'Conductor asignado'));
  v_text_body := REPLACE(v_text_body, '{{flight_number}}', COALESCE(v_reservation_record.flight_number, 'No especificado'));
  v_text_body := REPLACE(v_text_body, '{{special_requirements}}', COALESCE(v_reservation_record.special_requirements, 'Ninguna'));
  
  -- Crear log
  INSERT INTO email_logs (reservation_id, recipient_email, template_name, subject, status)
  VALUES (p_reservation_id, p_recipient_email, p_template_name, v_subject, 'pending')
  RETURNING id INTO v_log_id;
  
  -- Enviar correo usando la función nativa de Supabase
  BEGIN
    PERFORM net.http_post(
      url := 'https://api.supabase.io/v1/email',
      headers := '{"Authorization": "Bearer ' || current_setting('supabase.service_role_key') || '", "Content-Type": "application/json"}',
      body := json_build_object(
        'to', p_recipient_email,
        'subject', v_subject,
        'html', v_html_body,
        'text', v_text_body
      )::text
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
-- 6. TRIGGER PARA MANEJAR NOTIFICACIONES AUTOMÁTICAS
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

-- Crear trigger
DROP TRIGGER IF EXISTS reservation_email_trigger ON reservations;
CREATE TRIGGER reservation_email_trigger
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION handle_reservation_notifications_extended();

-- =============================================================================
-- 7. POLÍTICAS RLS PARA DRIVERS
-- =============================================================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Política: Admins pueden ver todos los conductores
CREATE POLICY drivers_admin_all ON drivers
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Conductores pueden ver su propia información
CREATE POLICY drivers_own_info ON drivers
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- =============================================================================
-- 8. FUNCIONES DE PRUEBA
-- =============================================================================

-- Función de prueba simple
CREATE OR REPLACE FUNCTION quick_email_test(
  p_test_email TEXT DEFAULT 'test@example.com'
)
RETURNS TABLE(
  step_number INT,
  step_description TEXT,
  result TEXT
) AS $$
DECLARE
  v_reservation_id UUID;
  v_log_id UUID;
BEGIN
  -- Paso 1: Buscar reserva
  RETURN QUERY SELECT 1, 'Buscando reserva de prueba...', 'Iniciando';
  
  SELECT r.id INTO v_reservation_id 
  FROM reservations r 
  ORDER BY r.created_at DESC 
  LIMIT 1;
  
  IF v_reservation_id IS NULL THEN
    RETURN QUERY SELECT 2, 'Error', 'No hay reservas para probar. Crea una reserva primero.';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 2, 'Reserva encontrada', v_reservation_id::TEXT;
  
  -- Paso 3: Probar envío
  RETURN QUERY SELECT 3, 'Enviando correo de prueba...', 'Procesando';
  
  BEGIN
    v_log_id := send_reservation_email_extended(
      v_reservation_id,
      'reservation_created',
      p_test_email
    );
    
    RETURN QUERY SELECT 4, 'Correo enviado', 'Log ID: ' || v_log_id::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 4, 'Error al enviar', SQLERRM;
  END;
  
  -- Paso 5: Mostrar logs
  RETURN QUERY SELECT 5, 'Ver logs más recientes', 'Consulta: SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;';
  
END;
$$ LANGUAGE plpgsql;

-- Función para probar todas las plantillas
CREATE OR REPLACE FUNCTION test_all_templates(
  p_test_email TEXT DEFAULT 'admin@transportestorres.cl'
)
RETURNS TABLE(
  template_name TEXT,
  status TEXT,
  log_id UUID
) AS $$
DECLARE
  v_reservation_id UUID;
  v_template RECORD;
  v_log_id UUID;
BEGIN
  -- Buscar reserva confirmada
  SELECT id INTO v_reservation_id 
  FROM reservations 
  WHERE status IN ('confirmed', 'pending')
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_reservation_id IS NULL THEN
    RETURN QUERY SELECT 'ERROR'::TEXT, 'No hay reservas disponibles'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Probar cada plantilla
  FOR v_template IN 
    SELECT et.template_name 
    FROM email_templates et 
    WHERE et.is_active = true
  LOOP
    BEGIN
      v_log_id := send_reservation_email_extended(
        v_reservation_id,
        v_template.template_name,
        p_test_email
      );
      
      RETURN QUERY SELECT v_template.template_name, 'ENVIADO'::TEXT, v_log_id;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_template.template_name, 'ERROR: ' || SQLERRM, NULL::UUID;
    END;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. VERIFICACIÓN FINAL
-- =============================================================================

SELECT 'Sistema de correos completo configurado exitosamente' as status;

SELECT 'Plantillas disponibles:' as info;
SELECT template_name, subject FROM email_templates ORDER BY template_name;

SELECT 'Conductores disponibles:' as info;
SELECT 
  full_name,
  email,
  phone,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  status
FROM drivers
ORDER BY full_name;

SELECT '=== COMANDOS DE PRUEBA ===' as info;
SELECT 'Para probar 1 correo:' as command_1;
SELECT 'SELECT * FROM quick_email_test(''tu-email@gmail.com'');' as example_1;

SELECT 'Para probar todas las plantillas:' as command_2;
SELECT 'SELECT * FROM test_all_templates(''tu-email@gmail.com'');' as example_2;

SELECT 'Para ver logs de correos:' as command_3;
SELECT 'SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;' as example_3;

SELECT '¡SISTEMA COMPLETO Y LISTO PARA USAR!' as final_message; 