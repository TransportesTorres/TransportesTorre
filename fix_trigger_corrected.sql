-- SCRIPT CORREGIDO PARA ARREGLAR EL TRIGGER
-- Ejecutar en Supabase SQL Editor

-- =============================================================================
-- 1. ELIMINAR POLÍTICA EXISTENTE Y RECREAR
-- =============================================================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Crear política que permita inserción por el sistema
CREATE POLICY "profiles_insert_policy" ON profiles 
  FOR INSERT 
  WITH CHECK (true);

-- =============================================================================
-- 2. ACTUALIZAR FUNCIÓN HANDLE_NEW_USER CON SINTAXIS CORRECTA
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Verificar que la función existe
SELECT 
  proname, 
  provolatile, 
  prosecdef
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verificar políticas de profiles
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname; 