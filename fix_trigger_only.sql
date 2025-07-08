-- SCRIPT SIMPLE PARA ARREGLAR SOLO EL TRIGGER
-- Ejecutar en Supabase SQL Editor

-- =============================================================================
-- 1. ELIMINAR POLÍTICA EXISTENTE Y RECREAR
-- =============================================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Crear política que permita inserción por el sistema
CREATE POLICY "profiles_insert_policy" ON profiles 
  FOR INSERT 
  WITH CHECK (true); -- Permitir todas las inserciones

-- =============================================================================
-- 2. ACTUALIZAR FUNCIÓN HANDLE_NEW_USER CON SECURITY DEFINER
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Ejecutar con permisos de postgres
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Obtener el nombre del usuario o usar valor por defecto
  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    'Usuario'
  );
  
  -- Insertar el perfil
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
-- 3. RECREAR TRIGGER
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 4. VERIFICAR RESULTADO
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
  qualifiedname
FROM pg_policies 
WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy'; 