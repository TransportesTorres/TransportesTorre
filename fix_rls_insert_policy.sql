-- SCRIPT PARA CORREGIR POLÍTICAS RLS DE INSERCIÓN
-- Ejecutar en Supabase SQL Editor

-- =============================================================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS DE PROFILES Y RECREAR
-- =============================================================================

-- Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;
DROP POLICY IF EXISTS "profiles_user_select" ON profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- =============================================================================
-- 2. CREAR POLÍTICAS PERMISIVAS PARA PROFILES
-- =============================================================================

-- Política para permitir todas las operaciones al service role
CREATE POLICY "profiles_service_role_all" 
ON profiles FOR ALL 
TO authenticated 
USING (auth.role() = 'service_role');

-- Política para permitir SELECT a usuarios autenticados
CREATE POLICY "profiles_select_own" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Política MUY PERMISIVA para INSERT - permite insertar cualquier perfil
CREATE POLICY "profiles_insert_any" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir UPDATE solo del propio perfil
CREATE POLICY "profiles_update_own" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- =============================================================================
-- 3. VERIFICAR POLÍTICAS APLICADAS
-- =============================================================================

SELECT 
  policyname, 
  cmd, 
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- =============================================================================
-- 4. PROBAR INSERCIÓN MANUALMENTE
-- =============================================================================

-- Función de prueba para verificar que se puede insertar
DO $$
BEGIN
  -- Intentar insertar un perfil de prueba
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (
    gen_random_uuid(),
    'test' || floor(random() * 1000) || '@example.com',
    'Usuario de Prueba',
    '+56912345678',
    'client'
  );
  
  RAISE NOTICE 'Perfil de prueba insertado exitosamente';
  
  -- Limpiar el perfil de prueba
  DELETE FROM profiles WHERE email LIKE 'test%@example.com';
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error al insertar perfil de prueba: %', SQLERRM;
END $$;

-- =============================================================================
-- 5. VERIFICAR CONFIGURACIÓN RLS
-- =============================================================================

-- Verificar que RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificar estado de las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using_clause,
  with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname; 