-- SCRIPT DE PRUEBA PARA VERIFICAR CONSULTAS DE RESERVAS
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar datos básicos
SELECT 'Verificando datos básicos...' as step;

SELECT 'Usuarios registrados:' as info;
SELECT id, email, full_name, role 
FROM profiles 
LIMIT 5;

SELECT 'Viajes disponibles:' as info;
SELECT id, origin, destination, status 
FROM trips 
WHERE status = 'available'
LIMIT 3;

SELECT 'Reservas existentes:' as info;
SELECT id, user_id, trip_id, status, confirmation_code, created_at
FROM reservations 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Probar consulta JOIN como la hace el frontend
SELECT 'Probando consulta JOIN...' as step;
SELECT 
  r.*,
  t.origin,
  t.destination,
  t.departure_time,
  p.email as user_email,
  p.full_name as user_name,
  p.phone as user_phone
FROM reservations r
JOIN trips t ON r.trip_id = t.id
JOIN profiles p ON r.user_id = p.id
ORDER BY r.created_at DESC
LIMIT 5;

-- 3. Probar consulta estilo Supabase (como la usamos en el código)
SELECT 'Probando consulta estilo Supabase...' as step;
-- Esta es una simulación de lo que hace Supabase internamente
-- No podemos usar la sintaxis exacta aquí, pero podemos verificar que los datos existen

-- Verificar que existen las relaciones
SELECT 'Verificando relaciones...' as info;
SELECT 
  r.id as reservation_id,
  r.confirmation_code,
  r.pickup_location,
  r.dropoff_location,
  r.status,
  t.id as trip_id,
  t.origin,
  t.destination,
  p.id as user_id,
  p.full_name,
  p.email,
  p.phone
FROM reservations r
LEFT JOIN trips t ON r.trip_id = t.id
LEFT JOIN profiles p ON r.user_id = p.id
ORDER BY r.created_at DESC;

-- 4. Verificar política RLS para admin
SELECT 'Verificando acceso de admin...' as step;
-- Esta consulta debería funcionar si estás logueado como admin
-- Si no funciona, hay un problema con las políticas RLS

-- 5. Contar registros para verificar
SELECT 'Conteos finales:' as step;
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM trips) as total_trips,
  (SELECT COUNT(*) FROM reservations) as total_reservations,
  (SELECT COUNT(*) FROM reservations WHERE status = 'pending') as pending_reservations;

SELECT 'Prueba de consultas completada' as final_status; 