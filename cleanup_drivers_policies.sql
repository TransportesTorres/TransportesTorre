-- Script para limpiar políticas conflictivas en la tabla drivers
-- Las políticas múltiples pueden causar conflictos

-- 1. Eliminar TODAS las políticas existentes para drivers
DROP POLICY IF EXISTS "Admins can delete drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;
DROP POLICY IF EXISTS "drivers_public_select" ON drivers;
DROP POLICY IF EXISTS "drivers_service_role_all" ON drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Anyone can view active drivers" ON drivers;

-- 2. Crear políticas limpias y específicas

-- SELECT: Admins ven todo, usuarios públicos solo activos
CREATE POLICY "drivers_select_policy" ON drivers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR is_active = true
  );

-- INSERT: Solo admins
CREATE POLICY "drivers_insert_policy" ON drivers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: Solo admins
CREATE POLICY "drivers_update_policy" ON drivers 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Solo admins
CREATE POLICY "drivers_delete_policy" ON drivers 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Verificar las políticas finales
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING CLAUSE'
    ELSE 'NO USING CLAUSE'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
    ELSE 'NO WITH CHECK'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'drivers'
ORDER BY cmd, policyname; 