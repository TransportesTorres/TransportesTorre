-- SCRIPT PARA ARREGLAR PERMISOS DEL TRIGGER HANDLE_NEW_USER
-- Ejecutar en Supabase SQL Editor

-- =============================================================================
-- 1. MODIFICAR FUNCIÓN HANDLE_NEW_USER CON PERMISOS ADECUADOS
-- =============================================================================

-- Actualizar función handle_new_user para usar security definer y bypassar RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Ejecutar con permisos del propietario (postgres)
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Obtener el nombre del usuario o usar valor por defecto
  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    'Usuario'
  );
  
  -- Insertar el perfil directamente sin verificar RLS
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_name,
    NEW.raw_user_meta_data->>'phone',
    'client'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log el error para debug
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. RECREAR TRIGGER
-- =============================================================================

-- Eliminar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger nuevo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 3. AGREGAR POLÍTICA ESPECIAL PARA INSERCIÓN DE PERFILES
-- =============================================================================

-- Eliminar política de inserción existente
DROP POLICY IF EXISTS "profiles_user_insert" ON profiles;

-- Crear política que permita inserción tanto por usuarios como por el sistema
CREATE POLICY "profiles_insert_policy" ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role' OR
    current_setting('role') = 'postgres'
  );

-- =============================================================================
-- 4. PROBAR LA FUNCIÓN MANUALMENTE
-- =============================================================================

-- Función de prueba para verificar que el trigger funciona
CREATE OR REPLACE FUNCTION test_profile_creation()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT;
BEGIN
  -- Intentar insertar un perfil de prueba
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (
    gen_random_uuid(),
    'test@example.com',
    'Usuario de Prueba',
    '+56912345678',
    'client'
  );
  
  RETURN 'Perfil de prueba creado exitosamente';
EXCEPTION
  WHEN others THEN
    RETURN 'Error al crear perfil de prueba: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar prueba
SELECT test_profile_creation();

-- Limpiar función de prueba
DROP FUNCTION test_profile_creation();

-- =============================================================================
-- 5. VERIFICAR CONFIGURACIÓN ACTUAL
-- =============================================================================

-- Verificar que el trigger existe
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar políticas de profiles
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname; 