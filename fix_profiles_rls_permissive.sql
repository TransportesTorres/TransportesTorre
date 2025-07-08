-- VERSIÓN PERMISIVA PARA ARREGLAR RLS DE PROFILES
-- Usar SOLO si el script anterior no funciona
-- Ejecutar este script en Supabase SQL Editor

-- 1. Eliminar TODAS las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable in reservation context" ON profiles;

-- 2. Crear políticas MUY permisivas para desarrollo
-- NOTA: Estas son políticas temporales para que funcione la aplicación

-- Política 1: Cualquier usuario autenticado puede ver cualquier perfil
-- (Necesario para que las reservas muestren información del cliente)
CREATE POLICY "Authenticated users can view profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Política 2: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can create own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política 3: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Política 4: Solo algunos usuarios pueden eliminar perfiles (muy restrictivo)
CREATE POLICY "Restricted delete on profiles" ON profiles 
FOR DELETE USING (false); -- Nadie puede eliminar por ahora

-- 3. Verificar las nuevas políticas
SELECT 'Políticas permisivas aplicadas:' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Verificar que RLS esté habilitado
SELECT 'Estado RLS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Políticas RLS permisivas aplicadas - ÚSALAS SOLO PARA DESARROLLO' as status; 