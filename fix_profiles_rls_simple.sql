-- ARREGLAR POLÍTICAS RLS DE PROFILES SIN RECURSIÓN
-- Ejecutar este script en Supabase SQL Editor

-- 1. Eliminar TODAS las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable in reservation context" ON profiles;

-- 2. Crear políticas simples sin referencias circulares

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Política 2: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can create own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política 3: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Política 4: SIMPLIFICADA - Los administradores pueden ver todos los perfiles
-- Usar auth.jwt() en lugar de consultar la tabla profiles
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  COALESCE(auth.jwt() ->> 'role', '') = 'admin'
  OR 
  auth.uid() = id
);

-- Política 5: Los administradores pueden gestionar todos los perfiles
CREATE POLICY "Admins can manage all profiles" ON profiles 
FOR ALL USING (
  COALESCE(auth.jwt() ->> 'role', '') = 'admin'
);

-- 3. Verificar las nuevas políticas
SELECT 'Nuevas políticas de profiles (sin recursión):' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Verificar que RLS esté habilitado
SELECT 'Estado RLS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Políticas RLS simplificadas aplicadas exitosamente' as status; 