-- AGREGAR TABLA DE CONDUCTORES Y COMPLETAR SISTEMA
-- Ejecutar este script para crear la tabla drivers y completar las relaciones

-- =============================================================================
-- 1. CREAR TABLA DRIVERS
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

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers(license_number);

-- =============================================================================
-- 2. AGREGAR COLUMNA driver_id A LA TABLA TRIPS (SI NO EXISTE)
-- =============================================================================

-- Verificar si la columna ya existe antes de agregarla
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

-- =============================================================================
-- 4. ASIGNAR CONDUCTORES A VIAJES EXISTENTES (OPCIONAL)
-- =============================================================================

-- Asignar conductores aleatoriamente a viajes que no tienen conductor
UPDATE trips 
SET driver_id = (
  SELECT id FROM drivers 
  WHERE status = 'active' 
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE driver_id IS NULL;

-- =============================================================================
-- 5. FUNCIONES ÚTILES PARA GESTIÓN DE CONDUCTORES
-- =============================================================================

-- Función para obtener conductor disponible
CREATE OR REPLACE FUNCTION get_available_driver(
  p_departure_time TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Buscar conductor que no tenga viajes en conflicto
  SELECT d.id INTO v_driver_id
  FROM drivers d
  WHERE d.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.driver_id = d.id
    AND t.departure_time BETWEEN 
      p_departure_time - INTERVAL '2 hours' 
      AND p_departure_time + INTERVAL '2 hours'
  )
  ORDER BY RANDOM()
  LIMIT 1;
  
  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql;

-- Función para asignar conductor automáticamente
CREATE OR REPLACE FUNCTION auto_assign_driver()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el viaje no tiene conductor asignado, buscar uno disponible
  IF NEW.driver_id IS NULL AND NEW.departure_time IS NOT NULL THEN
    NEW.driver_id := get_available_driver(NEW.departure_time);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignación automática
DROP TRIGGER IF EXISTS auto_assign_driver_trigger ON trips;
CREATE TRIGGER auto_assign_driver_trigger
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW 
  WHEN (NEW.status = 'available')
  EXECUTE FUNCTION auto_assign_driver();

-- =============================================================================
-- 6. POLÍTICAS RLS PARA DRIVERS
-- =============================================================================

-- Habilitar RLS
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
-- 7. VERIFICACIÓN Y RESUMEN
-- =============================================================================

SELECT 'Tabla drivers creada exitosamente' as status;

SELECT 'Conductores disponibles:' as info;
SELECT 
  full_name,
  email,
  phone,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  status
FROM drivers
ORDER BY full_name;

SELECT 'Viajes con conductores asignados:' as info;
SELECT 
  t.id,
  t.origin_city || ' → ' || t.destination_city as route,
  d.full_name as driver,
  d.vehicle_info->>'brand' || ' ' || d.vehicle_info->>'model' as vehicle
FROM trips t
LEFT JOIN drivers d ON t.driver_id = d.id
ORDER BY t.departure_time;

SELECT 'Para obtener conductor disponible:' as function_info;
SELECT 'SELECT get_available_driver(NOW() + INTERVAL ''1 day'');' as example_usage; 