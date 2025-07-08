-- SCRIPT FINAL PARA CREAR EL PERFIL AUTOMÁTICAMENTE
-- Ejecutar en Supabase SQL Editor.
-- Este script crea un trigger que se activa después de que un usuario se registra.
-- Utiliza SECURITY DEFINER para tener los permisos necesarios para insertar en la tabla 'profiles'.

-- =============================================================================
-- 1. CREAR LA FUNCIÓN QUE MANEJA LA CREACIÓN DEL PERFIL
-- =============================================================================
-- Esta función se ejecutará cada vez que se inserte un nuevo usuario en 'auth.users'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserta una nueva fila en la tabla 'profiles' con los datos del nuevo usuario.
  -- El ID viene de 'auth.users'. El nombre y teléfono vienen de los metadatos
  -- que pasamos durante el registro en el frontend.
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email,
    'client' -- Todos los nuevos registros son 'client' por defecto.
  );
  RETURN new;
END;
$$ 
LANGUAGE plpgsql 
SECURITY DEFINER; -- ¡IMPORTANTE! Ejecuta la función con los permisos del creador (postgres).

-- =============================================================================
-- 2. CREAR EL TRIGGER QUE ACTIVA LA FUNCIÓN
-- =============================================================================
-- Primero, eliminamos cualquier trigger anterior con el mismo nombre para evitar conflictos.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Creamos el trigger. Se activará DESPUÉS (`AFTER`) de cada `INSERT` en la tabla `auth.users`.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  
-- =============================================================================
-- 3. VERIFICACIÓN
-- =============================================================================
-- Comprueba que el trigger ha sido creado correctamente en la tabla 'auth.users'.
-- Si esta consulta devuelve una fila, significa que el trigger se creó exitosamente.
SELECT
    event_object_table,
    trigger_name,
    action_statement
FROM
    information_schema.triggers
WHERE
    event_object_table = 'users' AND trigger_name = 'on_auth_user_created'; 