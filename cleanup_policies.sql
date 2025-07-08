-- SCRIPT DE LIMPIEZA COMPLETA DE POLÍTICAS RLS
-- Ejecutar en Supabase SQL Editor para limpiar todas las políticas conflictivas

-- =============================================================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =============================================================================

-- Profiles
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Enable all access for service role" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on uid" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Drivers
DROP POLICY IF EXISTS "Anyone can view active drivers" ON drivers;
DROP POLICY IF EXISTS "Enable all access for service role on drivers" ON drivers;
DROP POLICY IF EXISTS "Enable read access for drivers" ON drivers;

-- Service Types
DROP POLICY IF EXISTS "Anyone can view service types" ON service_types;
DROP POLICY IF EXISTS "Enable all access for service role on service_types" ON service_types;
DROP POLICY IF EXISTS "Enable read access for service types" ON service_types;

-- Vehicle Categories
DROP POLICY IF EXISTS "Anyone can view vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Enable all access for service role on vehicle_categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Enable read access for vehicle categories" ON vehicle_categories;

-- Trips
DROP POLICY IF EXISTS "Anyone can view available trips" ON trips;
DROP POLICY IF EXISTS "Enable all access for service role on trips" ON trips;
DROP POLICY IF EXISTS "Enable read access for available trips" ON trips;

-- Reservations
DROP POLICY IF EXISTS "Enable all access for service role on reservations" ON reservations;
DROP POLICY IF EXISTS "Enable insert for authenticated users on reservations" ON reservations;
DROP POLICY IF EXISTS "Enable read access for own reservations" ON reservations;
DROP POLICY IF EXISTS "Enable update for own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;

-- Packages
DROP POLICY IF EXISTS "Enable all access for service role on packages" ON packages;
DROP POLICY IF EXISTS "Enable read access for packages" ON packages;
DROP POLICY IF EXISTS "Users can view their packages" ON packages;

-- Ratings
DROP POLICY IF EXISTS "Enable all access for service role on ratings" ON ratings;
DROP POLICY IF EXISTS "Enable insert for own ratings" ON ratings;
DROP POLICY IF EXISTS "Enable read access for all ratings" ON ratings;
DROP POLICY IF EXISTS "Users can create ratings for their reservations" ON ratings;
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;

-- Performance Reports
DROP POLICY IF EXISTS "Enable all access for service role on performance_reports" ON performance_reports;

-- Pricing Rules
DROP POLICY IF EXISTS "Enable all access for service role on pricing_rules" ON pricing_rules;

-- =============================================================================
-- 2. CREAR POLÍTICAS ÚNICAS Y SIMPLES
-- =============================================================================

-- PROFILES - Políticas simples sin recursión
CREATE POLICY "profiles_service_role_all" ON profiles FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "profiles_user_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_user_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_user_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- DRIVERS - Políticas simples
CREATE POLICY "drivers_service_role_all" ON drivers FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "drivers_public_select" ON drivers FOR SELECT TO authenticated USING (is_active = true);

-- SERVICE_TYPES - Políticas simples
CREATE POLICY "service_types_service_role_all" ON service_types FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "service_types_public_select" ON service_types FOR SELECT TO authenticated USING (is_active = true);

-- VEHICLE_CATEGORIES - Políticas simples
CREATE POLICY "vehicle_categories_service_role_all" ON vehicle_categories FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "vehicle_categories_public_select" ON vehicle_categories FOR SELECT TO authenticated USING (true);

-- TRIPS - Políticas simples
CREATE POLICY "trips_service_role_all" ON trips FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "trips_public_select" ON trips FOR SELECT TO authenticated USING (status = 'available');

-- RESERVATIONS - Políticas simples
CREATE POLICY "reservations_service_role_all" ON reservations FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "reservations_user_select" ON reservations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reservations_user_insert" ON reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_user_update" ON reservations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PACKAGES - Políticas simples
CREATE POLICY "packages_service_role_all" ON packages FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "packages_user_select" ON packages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE id = reservation_id AND user_id = auth.uid()
  )
);

-- RATINGS - Políticas simples
CREATE POLICY "ratings_service_role_all" ON ratings FOR ALL TO authenticated USING (auth.role() = 'service_role');
CREATE POLICY "ratings_public_select" ON ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings_user_insert" ON ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PERFORMANCE_REPORTS - Solo service role
CREATE POLICY "performance_reports_service_role_all" ON performance_reports FOR ALL TO authenticated USING (auth.role() = 'service_role');

-- PRICING_RULES - Solo service role
CREATE POLICY "pricing_rules_service_role_all" ON pricing_rules FOR ALL TO authenticated USING (auth.role() = 'service_role');

-- =============================================================================
-- 3. VERIFICAR FUNCIÓN handle_new_user Y RECREAR TRIGGER
-- =============================================================================

-- Actualizar función handle_new_user para ser más robusta
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
    -- Log el error pero no fallar
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 4. VERIFICAR RESULTADO
-- =============================================================================

SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname; 