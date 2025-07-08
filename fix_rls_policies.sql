-- SCRIPT PARA CORREGIR POLÍTICAS RLS RECURSIVAS
-- Ejecutar en Supabase SQL Editor para arreglar el problema de registro

-- =============================================================================
-- 1. ELIMINAR POLÍTICAS RECURSIVAS PROBLEMÁTICAS
-- =============================================================================

-- Eliminar políticas recursivas de profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Eliminar políticas recursivas de otras tablas que dependen de profiles
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can manage service types" ON service_types;
DROP POLICY IF EXISTS "Admins can manage vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admins can manage trips" ON trips;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON packages;
DROP POLICY IF EXISTS "Only admins can view performance reports" ON performance_reports;
DROP POLICY IF EXISTS "Only admins can manage performance reports" ON performance_reports;
DROP POLICY IF EXISTS "Admins can view pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON pricing_rules;

-- =============================================================================
-- 2. CREAR POLÍTICAS SIMPLES Y NO RECURSIVAS
-- =============================================================================

-- Políticas para profiles (sin recursión)
CREATE POLICY "Enable all access for service role" ON profiles FOR ALL USING (
  auth.role() = 'service_role'
);

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (
  auth.uid() = id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable insert for authentication users" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable update for users based on uid" ON profiles FOR UPDATE USING (
  auth.uid() = id OR auth.role() = 'service_role'
);

-- Políticas para drivers (sin recursión)
CREATE POLICY "Enable read access for drivers" ON drivers FOR SELECT USING (
  is_active = true OR auth.role() = 'service_role'
);

CREATE POLICY "Enable all access for service role on drivers" ON drivers FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para service_types (sin recursión)
CREATE POLICY "Enable read access for service types" ON service_types FOR SELECT USING (
  is_active = true OR auth.role() = 'service_role'
);

CREATE POLICY "Enable all access for service role on service_types" ON service_types FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para vehicle_categories (sin recursión)
CREATE POLICY "Enable read access for vehicle categories" ON vehicle_categories FOR SELECT USING (
  auth.role() = 'service_role' OR true
);

CREATE POLICY "Enable all access for service role on vehicle_categories" ON vehicle_categories FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para trips (sin recursión)
CREATE POLICY "Enable read access for available trips" ON trips FOR SELECT USING (
  status = 'available' OR auth.role() = 'service_role'
);

CREATE POLICY "Enable all access for service role on trips" ON trips FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para reservations (sin recursión)
CREATE POLICY "Enable read access for own reservations" ON reservations FOR SELECT USING (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable insert for authenticated users on reservations" ON reservations FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable update for own reservations" ON reservations FOR UPDATE USING (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable all access for service role on reservations" ON reservations FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para packages (sin recursión)
CREATE POLICY "Enable read access for packages" ON packages FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM reservations 
    WHERE id = reservation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Enable all access for service role on packages" ON packages FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para ratings (sin recursión)
CREATE POLICY "Enable read access for all ratings" ON ratings FOR SELECT USING (true);

CREATE POLICY "Enable insert for own ratings" ON ratings FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.role() = 'service_role'
);

CREATE POLICY "Enable all access for service role on ratings" ON ratings FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para performance_reports (sin recursión)
CREATE POLICY "Enable all access for service role on performance_reports" ON performance_reports FOR ALL USING (
  auth.role() = 'service_role'
);

-- Políticas para pricing_rules (sin recursión)
CREATE POLICY "Enable all access for service role on pricing_rules" ON pricing_rules FOR ALL USING (
  auth.role() = 'service_role'
);

-- =============================================================================
-- 3. VERIFICAR FUNCIÓN HANDLE_NEW_USER
-- =============================================================================

-- Actualizar función handle_new_user para manejar mejor los campos vacíos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Usuario'), 
    NEW.raw_user_meta_data->>'phone',
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. RECREAR TRIGGER
-- =============================================================================

-- Recrear trigger para asegurar que funcione correctamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 5. VERIFICACIÓN
-- =============================================================================

-- Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname; 