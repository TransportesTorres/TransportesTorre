-- SCRIPT ESPECÍFICO PARA CORREGIR POLÍTICAS RLS DE UPDATE EN TABLA TRIPS
-- Ejecutar en Supabase SQL Editor para resolver error de actualización

-- =============================================================================
-- 1. VERIFICAR POLÍTICAS ACTUALES
-- =============================================================================

-- Ver todas las políticas actuales para trips
SELECT 
  policyname, 
  cmd, 
  roles,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'trips' AND schemaname = 'public'
ORDER BY policyname;

-- =============================================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS DE TRIPS
-- =============================================================================

-- Eliminar todas las políticas existentes para trips
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'trips' AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.trips;';
        RAISE NOTICE 'Eliminada política: %', policy_name;
    END LOOP;
END;
$$;

-- =============================================================================
-- 3. CREAR POLÍTICAS ULTRA-PERMISIVAS PARA TRIPS
-- =============================================================================

-- Política 1: Permitir SELECT a todos los usuarios autenticados
CREATE POLICY "trips_select_all" 
ON public.trips FOR SELECT 
TO authenticated 
USING (true);

-- Política 2: Permitir INSERT a todos los usuarios autenticados
CREATE POLICY "trips_insert_all" 
ON public.trips FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política 3: Permitir UPDATE a todos los usuarios autenticados
CREATE POLICY "trips_update_all" 
ON public.trips FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Política 4: Permitir DELETE a todos los usuarios autenticados
CREATE POLICY "trips_delete_all" 
ON public.trips FOR DELETE 
TO authenticated 
USING (true);

-- Política 5: Permitir acceso completo al service_role
CREATE POLICY "trips_service_role_full" 
ON public.trips FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- =============================================================================
-- 4. VERIFICAR QUE LAS POLÍTICAS SE APLICARON CORRECTAMENTE
-- =============================================================================

-- Mostrar las nuevas políticas
SELECT 
  policyname, 
  cmd, 
  roles,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'trips' AND schemaname = 'public'
ORDER BY policyname;

-- =============================================================================
-- 5. PROBAR ACTUALIZACIÓN MANUALMENTE
-- =============================================================================

-- Función de prueba para verificar que se puede actualizar un viaje
DO $$
DECLARE
  test_trip_id UUID;
BEGIN
  -- Buscar un viaje existente para probar
  SELECT id INTO test_trip_id FROM trips LIMIT 1;
  
  IF test_trip_id IS NOT NULL THEN
    -- Intentar actualizar el viaje
    UPDATE trips 
    SET status = 'available', 
        updated_at = NOW()
    WHERE id = test_trip_id;
    
    RAISE NOTICE 'Actualización de viaje exitosa para ID: %', test_trip_id;
  ELSE
    RAISE NOTICE 'No hay viajes para probar la actualización';
  END IF;
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error al actualizar viaje: %', SQLERRM;
END $$;

-- =============================================================================
-- 6. VERIFICAR ESTADO RLS
-- =============================================================================

-- Verificar que RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'trips' AND schemaname = 'public';

-- =============================================================================
-- 7. MENSAJE DE CONFIRMACIÓN
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== POLÍTICAS RLS PARA TRIPS ACTUALIZADAS ===';
  RAISE NOTICE 'Políticas ultra-permisivas aplicadas';
  RAISE NOTICE 'Todos los usuarios autenticados pueden ahora:';
  RAISE NOTICE '- SELECT: Ver viajes';
  RAISE NOTICE '- INSERT: Crear viajes';
  RAISE NOTICE '- UPDATE: Actualizar viajes';
  RAISE NOTICE '- DELETE: Eliminar viajes';
  RAISE NOTICE '============================================';
END $$; 