-- ===================================================================
-- SCRIPT PARA AGREGAR NUEVOS CONDUCTORES
-- ===================================================================
-- Ejecutar este script cada vez que necesites agregar conductores
-- Puedes modificar los datos y ejecutar múltiples veces

-- =============================================================================
-- FUNCIÓN PARA AGREGAR CONDUCTOR
-- =============================================================================

CREATE OR REPLACE FUNCTION add_driver(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_license_number TEXT,
  p_vehicle_brand TEXT,
  p_vehicle_model TEXT,
  p_vehicle_year INTEGER,
  p_vehicle_color TEXT,
  p_vehicle_plate TEXT,
  p_vehicle_capacity INTEGER,
  p_vehicle_features TEXT[] DEFAULT '{}',
  p_status TEXT DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
  v_driver_id UUID;
  v_vehicle_info JSONB;
BEGIN
  -- Crear objeto JSON para vehículo
  v_vehicle_info := json_build_object(
    'brand', p_vehicle_brand,
    'model', p_vehicle_model,
    'year', p_vehicle_year,
    'color', p_vehicle_color,
    'plate', p_vehicle_plate,
    'capacity', p_vehicle_capacity,
    'features', p_vehicle_features
  );
  
  -- Insertar conductor
  INSERT INTO drivers (
    full_name, email, phone, license_number, 
    vehicle_info, status
  ) VALUES (
    p_full_name, p_email, p_phone, p_license_number,
    v_vehicle_info, p_status
  )
  RETURNING id INTO v_driver_id;
  
  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- EJEMPLOS DE USO
-- =============================================================================

-- Ejemplo 1: Agregar conductor con auto pequeño
SELECT add_driver(
  'Ana Martínez',
  'ana.martinez@transportestorres.cl',
  '+56 9 5432 1098',
  'LIC-004-2024',
  'Chevrolet',
  'Spark',
  2023,
  'Rojo',
  'ABCD-12',
  4,
  ARRAY['Aire acondicionado', 'Bluetooth']
) as nuevo_conductor_id;

-- Ejemplo 2: Agregar conductor con van
SELECT add_driver(
  'Luis Rodríguez',
  'luis.rodriguez@transportestorres.cl',
  '+56 9 4321 0987',
  'LIC-005-2024',
  'Nissan',
  'Urvan',
  2022,
  'Blanco',
  'EFGH-34',
  12,
  ARRAY['Aire acondicionado', 'WiFi', 'Cargador USB']
) as nuevo_conductor_id;

-- Ejemplo 3: Agregar conductor con bus
SELECT add_driver(
  'Carmen López',
  'carmen.lopez@transportestorres.cl',
  '+56 9 3210 8765',
  'LIC-006-2024',
  'Mercedes',
  'OH 1628',
  2021,
  'Azul',
  'IJKL-56',
  25,
  ARRAY['Aire acondicionado', 'Micrófono', 'TV', 'Baño']
) as nuevo_conductor_id;

-- =============================================================================
-- FUNCIÓN PARA MODIFICAR CONDUCTOR
-- =============================================================================

CREATE OR REPLACE FUNCTION update_driver_vehicle(
  p_driver_id UUID,
  p_vehicle_brand TEXT,
  p_vehicle_model TEXT,
  p_vehicle_year INTEGER,
  p_vehicle_color TEXT,
  p_vehicle_plate TEXT,
  p_vehicle_capacity INTEGER,
  p_vehicle_features TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_vehicle_info JSONB;
BEGIN
  -- Crear objeto JSON para vehículo
  v_vehicle_info := json_build_object(
    'brand', p_vehicle_brand,
    'model', p_vehicle_model,
    'year', p_vehicle_year,
    'color', p_vehicle_color,
    'plate', p_vehicle_plate,
    'capacity', p_vehicle_capacity,
    'features', p_vehicle_features
  );
  
  -- Actualizar conductor
  UPDATE drivers 
  SET vehicle_info = v_vehicle_info,
      updated_at = NOW()
  WHERE id = p_driver_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN PARA DESACTIVAR CONDUCTOR
-- =============================================================================

CREATE OR REPLACE FUNCTION deactivate_driver(
  p_driver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE drivers 
  SET status = 'inactive',
      updated_at = NOW()
  WHERE id = p_driver_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN PARA ACTIVAR CONDUCTOR
-- =============================================================================

CREATE OR REPLACE FUNCTION activate_driver(
  p_driver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE drivers 
  SET status = 'active',
      updated_at = NOW()
  WHERE id = p_driver_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CONSULTAS ÚTILES
-- =============================================================================

-- Ver todos los conductores
SELECT 'Conductores registrados:' as info;
SELECT 
  id,
  full_name,
  email,
  phone,
  license_number,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  vehicle_info->>'plate' as placa,
  (vehicle_info->>'capacity')::INTEGER as capacidad,
  status,
  created_at
FROM drivers
ORDER BY full_name;

-- Ver solo conductores activos
SELECT 'Conductores activos:' as info;
SELECT 
  full_name,
  email,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  (vehicle_info->>'capacity')::INTEGER as capacidad
FROM drivers
WHERE status = 'active'
ORDER BY full_name;

-- Ver conductores con más capacidad
SELECT 'Conductores con mayor capacidad:' as info;
SELECT 
  full_name,
  vehicle_info->>'brand' || ' ' || vehicle_info->>'model' as vehicle,
  (vehicle_info->>'capacity')::INTEGER as capacidad
FROM drivers
WHERE status = 'active'
ORDER BY (vehicle_info->>'capacity')::INTEGER DESC;

-- =============================================================================
-- INSTRUCCIONES DE USO
-- =============================================================================

SELECT '=== CÓMO AGREGAR CONDUCTORES ===' as info;
SELECT 'Opción 1: Usar la función add_driver()' as opcion1;
SELECT 'Opción 2: Modificar este script y ejecutar' as opcion2;
SELECT 'Opción 3: Crear interfaz de admin en la app' as opcion3;

SELECT '=== EJEMPLOS DE COMANDOS ===' as info;
SELECT 'Para agregar:' as comando1;
SELECT 'SELECT add_driver(''Nombre'', ''email@empresa.cl'', ''+56 9 1234 5678'', ''LIC-XXX'', ''Toyota'', ''Corolla'', 2023, ''Blanco'', ''ABCD-12'', 4, ARRAY[''Aire acondicionado'']);' as ejemplo1;

SELECT 'Para desactivar:' as comando2;
SELECT 'SELECT deactivate_driver(''UUID-DEL-CONDUCTOR'');' as ejemplo2;

SELECT 'Para reactivar:' as comando3;
SELECT 'SELECT activate_driver(''UUID-DEL-CONDUCTOR'');' as ejemplo3;

SELECT '🚗 Sistema listo para agregar conductores dinámicamente!' as final_message; 