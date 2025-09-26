-- Script para corregir las políticas RLS de la tabla drivers
-- Problema: Los UPDATE fallan con PGRST116 para usuarios admin

-- 1. Eliminar políticas existentes para drivers
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Anyone can view active drivers" ON drivers;

-- 2. Crear políticas más específicas y claras

-- Política para SELECT: Admins pueden ver todos, otros solo activos
CREATE POLICY "Admins can view all drivers" ON drivers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR is_active = true
  );

-- Política para INSERT: Solo admins pueden crear conductores
CREATE POLICY "Admins can insert drivers" ON drivers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para UPDATE: Solo admins pueden actualizar conductores
CREATE POLICY "Admins can update drivers" ON drivers 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para DELETE: Solo admins pueden eliminar conductores
CREATE POLICY "Admins can delete drivers" ON drivers 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Verificar que las políticas están activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'drivers'
ORDER BY policyname; 