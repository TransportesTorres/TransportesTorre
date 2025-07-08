-- SCRIPT DE DEBUG PARA VERIFICAR RESERVAS
-- Ejecutar este script en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar que la tabla reservations existe
SELECT 'Verificando tabla reservations...' as debug_step;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'reservations';

-- 2. Verificar estructura de la tabla
SELECT 'Verificando estructura de reservations...' as debug_step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT 'Verificando políticas RLS...' as debug_step;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reservations';

-- 4. Verificar si RLS está habilitado
SELECT 'Verificando RLS...' as debug_step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reservations';

-- 5. Verificar triggers
SELECT 'Verificando triggers...' as debug_step;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservations';

-- 6. Verificar funciones relacionadas
SELECT 'Verificando funciones...' as debug_step;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('generate_confirmation_code', 'set_confirmation_code', 'update_updated_at_column');

-- 7. Verificar usuarios y perfiles
SELECT 'Verificando perfiles...' as debug_step;
SELECT id, email, role, full_name
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Verificar viajes disponibles
SELECT 'Verificando viajes disponibles...' as debug_step;
SELECT id, origin, destination, status, departure_time
FROM trips 
WHERE status = 'available'
ORDER BY departure_time 
LIMIT 5;

-- 9. Verificar reservas existentes
SELECT 'Verificando reservas existentes...' as debug_step;
SELECT id, user_id, trip_id, status, confirmation_code, created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 10. Verificar datos de prueba insertados
SELECT 'Verificando datos de prueba...' as debug_step;
SELECT 
  'service_types' as table_name, 
  count(*) as record_count 
FROM service_types
UNION ALL
SELECT 
  'drivers' as table_name, 
  count(*) as record_count 
FROM drivers
UNION ALL
SELECT 
  'trips' as table_name, 
  count(*) as record_count 
FROM trips
UNION ALL
SELECT 
  'profiles' as table_name, 
  count(*) as record_count 
FROM profiles
UNION ALL
SELECT 
  'reservations' as table_name, 
  count(*) as record_count 
FROM reservations;

-- 11. Verificar si hay problemas con foreign keys
SELECT 'Verificando foreign keys...' as debug_step;
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'reservations';

-- 12. Probar inserción de reserva de prueba (solo para debug)
SELECT 'Probando inserción de reserva...' as debug_step;
-- NOTA: Cambiar los IDs por IDs reales de tu base de datos
-- INSERT INTO reservations (trip_id, user_id, passenger_count, passenger_names, total_price, pickup_location, dropoff_location, contact_phone, status, payment_status) 
-- VALUES (
--   (SELECT id FROM trips WHERE status = 'available' LIMIT 1),
--   (SELECT id FROM profiles WHERE role = 'client' LIMIT 1),
--   1,
--   '["Usuario de Prueba"]',
--   25000,
--   'Ubicación de prueba',
--   'Destino de prueba',
--   '+56912345678',
--   'pending',
--   'pending'
-- );

SELECT 'DEBUG COMPLETADO' as final_status; 