-- ARREGLAR POLÍTICAS RLS DE PROFILES PARA RESERVAS
-- Ejecutar este script en Supabase SQL Editor

-- Verificar políticas actuales de profiles
SELECT 'Políticas actuales de profiles:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Eliminar políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Crear nuevas políticas más específicas
-- 1. Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- 2. Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- 3. Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can create their own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Los administradores pueden gestionar todos los perfiles
CREATE POLICY "Admins can manage all profiles" ON profiles 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. POLÍTICA ESPECIAL: Permitir acceso a perfiles en contexto de reservas
-- Esta política permite que los datos de perfil se vean cuando están relacionados con reservas
CREATE POLICY "Profiles viewable in reservation context" ON profiles 
FOR SELECT USING (
  -- Si el usuario que consulta es admin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- O si es el propio usuario
  auth.uid() = id
  OR
  -- O si existe una reserva que involucra a este usuario y el que consulta es admin o el propio usuario
  EXISTS (
    SELECT 1 FROM reservations r
    JOIN profiles p ON p.id = auth.uid()
    WHERE r.user_id = profiles.id 
    AND (p.role = 'admin' OR r.user_id = auth.uid())
  )
);

-- Verificar las nuevas políticas
SELECT 'Nuevas políticas de profiles:' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar que RLS esté habilitado
SELECT 'Estado RLS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Políticas RLS de profiles actualizadas exitosamente' as status; 