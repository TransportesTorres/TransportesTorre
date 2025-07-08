-- SCRIPT DE RESETEO FINAL PARA POLÍTICAS DE PERFILES (CORREGIDO)
-- Esta es la configuración estándar y recomendada para la tabla de perfiles.
-- Ejecutar en Supabase SQL Editor para resolver el error de inserción.

-- =============================================================================
-- 1. ASEGURAR QUE RLS ESTÉ HABILITADO
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS ANTERIORES EN LA TABLA 'PROFILES'
-- =============================================================================
-- Usar un bucle para eliminar todas las políticas y evitar errores si no existen.
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles;';
    END LOOP;
END;
$$;


-- =============================================================================
-- 3. CREAR LAS POLÍTICAS ESTÁNDAR Y SEGURAS
-- =============================================================================

-- Política 1: Los usuarios pueden insertar su propio perfil.
-- La cláusula `WITH CHECK` se evalúa antes de que la fila sea insertada.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política 2: Los usuarios pueden ver su propio perfil.
-- La cláusula `USING` se aplica a las filas que son devueltas por una consulta.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Política 3: Los usuarios pueden actualizar su propio perfil.
-- La cláusula `USING` comprueba las filas existentes que pueden ser actualizadas.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- =============================================================================
-- 4. VERIFICACIÓN FINAL
-- =============================================================================
-- Verificar que solo las 3 políticas nuevas existen para la tabla de perfiles.
-- La salida de esta consulta le mostrará las políticas que se han aplicado.
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname; 