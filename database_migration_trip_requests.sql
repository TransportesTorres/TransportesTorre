-- Migración para el sistema de solicitudes de viaje
-- Ejecutar en Supabase SQL Editor

-- 1. Modificar la tabla reservations para permitir trip_id nulo
ALTER TABLE reservations ALTER COLUMN trip_id DROP NOT NULL;

-- 2. Agregar nuevos campos a la tabla reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requester_name TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requester_email TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS flight_type TEXT CHECK (flight_type IN ('nacional', 'internacional', null));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS service_date DATE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pickup_time TIME;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS luggage_hand INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS luggage_checked INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS additional_services TEXT;

-- 3. Agregar campos para almacenar datos de solicitud de viaje
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_origin TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_destination TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_departure_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_estimated_duration INTEGER;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_service_type_id UUID REFERENCES service_types(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_vehicle_category TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_includes_tolls BOOLEAN DEFAULT true;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_includes_parking BOOLEAN DEFAULT true;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS trip_request_gps_tracking BOOLEAN DEFAULT true;

-- 4. Modificar la tabla trips para hacer driver_id opcional (se asignará al aprobar)
ALTER TABLE trips ALTER COLUMN driver_id DROP NOT NULL;

-- 5. Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_trip_id ON reservations(trip_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_service_date ON reservations(service_date);

-- 6. Actualizar las políticas RLS para incluir solicitudes sin trip_id
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
CREATE POLICY "Users can create their own reservations" ON reservations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations" ON reservations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
CREATE POLICY "Admins can manage all reservations" ON reservations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Función para generar código de confirmación mejorado
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TT' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 8. Comentarios para documentar los cambios
COMMENT ON COLUMN reservations.trip_id IS 'Referencia al viaje (NULL para solicitudes pendientes)';
COMMENT ON COLUMN reservations.company_name IS 'Nombre de la empresa solicitante (opcional)';
COMMENT ON COLUMN reservations.requester_name IS 'Nombre completo del solicitante';
COMMENT ON COLUMN reservations.requester_email IS 'Correo electrónico del solicitante';
COMMENT ON COLUMN reservations.flight_type IS 'Tipo de vuelo: nacional o internacional';
COMMENT ON COLUMN reservations.service_date IS 'Fecha del servicio solicitado';
COMMENT ON COLUMN reservations.pickup_time IS 'Hora de recogida';
COMMENT ON COLUMN reservations.luggage_hand IS 'Cantidad de maletas de mano';
COMMENT ON COLUMN reservations.luggage_checked IS 'Cantidad de maletas sobre 23 kilos';
COMMENT ON COLUMN reservations.additional_services IS 'Servicios adicionales requeridos';

-- 9. Verificar que todo está correcto
SELECT 
  'Migración completada exitosamente' as status,
  COUNT(*) as total_reservations
FROM reservations; 