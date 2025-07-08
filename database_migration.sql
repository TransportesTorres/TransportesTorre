-- MIGRACIÓN COMPLETA DE BASE DE DATOS - TRANSPORTES TORRES
-- Ejecutar este script completo en Supabase SQL Editor

-- =============================================================================
-- 1. CREAR EXTENSIONES Y FUNCIONES BASE
-- =============================================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para generar código de confirmación
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de confirmación en reservas
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code = generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.raw_user_meta_data->>'phone',
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. CREAR TABLAS (DROP IF EXISTS para actualizar)
-- =============================================================================

-- Tabla de usuarios (roles)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Tabla de tipos de servicios
DROP TABLE IF EXISTS service_types CASCADE;
CREATE TABLE service_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  pricing_unit TEXT NOT NULL CHECK (pricing_unit IN ('fixed', 'per_km', 'per_hour', 'per_30min')),
  includes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de categorías de vehículos
DROP TABLE IF EXISTS vehicle_categories CASCADE;
CREATE TABLE vehicle_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_passengers INTEGER NOT NULL,
  luggage_capacity TEXT,
  features JSONB DEFAULT '[]',
  base_price_multiplier DECIMAL(3,2) DEFAULT 1.00,
  examples JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de conductores/choferes
DROP TABLE IF EXISTS drivers CASCADE;
CREATE TABLE drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'A-2' CHECK (license_type IN ('A-2', 'A-3', 'A-4', 'A-5')),
  experience_years INTEGER NOT NULL DEFAULT 0,
  vehicle_info JSONB NOT NULL DEFAULT '{}',
  certifications JSONB NOT NULL DEFAULT '{"road_safety": false, "customer_service": false, "transport_regulations": false, "last_training_date": null}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de viajes
DROP TABLE IF EXISTS trips CASCADE;
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER DEFAULT 0, -- en minutos
  service_type_id UUID REFERENCES service_types(id) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_passengers INTEGER NOT NULL DEFAULT 1,
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  vehicle_category TEXT NOT NULL DEFAULT 'sedan_ejecutivo',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in_progress', 'completed', 'cancelled')),
  special_instructions TEXT,
  includes_tolls BOOLEAN DEFAULT true,
  includes_parking BOOLEAN DEFAULT true,
  gps_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de reservas
DROP TABLE IF EXISTS reservations CASCADE;
CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  passenger_names JSONB DEFAULT '[]',
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  special_requirements TEXT,
  contact_phone TEXT NOT NULL,
  flight_number TEXT, -- Para servicios de aeropuerto
  waiting_time INTEGER DEFAULT 0, -- En minutos
  extra_stops JSONB DEFAULT '[]',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  confirmation_code TEXT UNIQUE NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de encomiendas/paquetes
DROP TABLE IF EXISTS packages CASCADE;
CREATE TABLE packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) NOT NULL,
  description TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL, -- en kg
  dimensions JSONB, -- {length, width, height}
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed')),
  delivery_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de notificaciones por email
DROP TABLE IF EXISTS email_notifications CASCADE;
CREATE TABLE email_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('confirmation', 'trip_started', 'trip_completed', 'rating_request')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email_content JSONB
);

-- Tabla de valoraciones
DROP TABLE IF EXISTS ratings CASCADE;
CREATE TABLE ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  vehicle_condition_rating INTEGER NOT NULL CHECK (vehicle_condition_rating >= 1 AND vehicle_condition_rating <= 5),
  driver_service_rating INTEGER NOT NULL CHECK (driver_service_rating >= 1 AND driver_service_rating <= 5),
  comment TEXT,
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de reportes de desempeño
DROP TABLE IF EXISTS performance_reports CASCADE;
CREATE TABLE performance_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  cancelled_trips INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  driver_performance JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de reglas de precios
DROP TABLE IF EXISTS pricing_rules CASCADE;
CREATE TABLE pricing_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_type_id UUID REFERENCES service_types(id) NOT NULL,
  vehicle_category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  per_km_rate DECIMAL(8,2),
  per_hour_rate DECIMAL(8,2),
  waiting_time_rate DECIMAL(8,2),
  night_surcharge DECIMAL(5,2) DEFAULT 0,
  weekend_surcharge DECIMAL(5,2) DEFAULT 0,
  holiday_surcharge DECIMAL(5,2) DEFAULT 0,
  minimum_charge DECIMAL(8,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================================================
-- 3. CREAR TRIGGERS
-- =============================================================================

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_types_updated_at ON service_types;
CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_categories_updated_at ON vehicle_categories;
CREATE TRIGGER update_vehicle_categories_updated_at BEFORE UPDATE ON vehicle_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para generar código de confirmación automáticamente
DROP TRIGGER IF EXISTS set_reservation_confirmation_code ON reservations;
CREATE TRIGGER set_reservation_confirmation_code 
  BEFORE INSERT ON reservations 
  FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para drivers
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Anyone can view active drivers" ON drivers;
CREATE POLICY "Admins can manage drivers" ON drivers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Anyone can view active drivers" ON drivers FOR SELECT USING (is_active = true);

-- Políticas para service_types
DROP POLICY IF EXISTS "Anyone can view service types" ON service_types;
DROP POLICY IF EXISTS "Admins can manage service types" ON service_types;
CREATE POLICY "Anyone can view service types" ON service_types FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage service types" ON service_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para vehicle_categories
DROP POLICY IF EXISTS "Anyone can view vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admins can manage vehicle categories" ON vehicle_categories;
CREATE POLICY "Anyone can view vehicle categories" ON vehicle_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage vehicle categories" ON vehicle_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para trips
DROP POLICY IF EXISTS "Anyone can view available trips" ON trips;
DROP POLICY IF EXISTS "Admins can manage trips" ON trips;
CREATE POLICY "Anyone can view available trips" ON trips FOR SELECT USING (status = 'available');
CREATE POLICY "Admins can manage trips" ON trips FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reservations" ON reservations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage reservations" ON reservations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para packages
DROP POLICY IF EXISTS "Users can view their packages" ON packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON packages;
CREATE POLICY "Users can view their packages" ON packages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE id = reservation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all packages" ON packages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para ratings
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can create ratings for their reservations" ON ratings;
CREATE POLICY "Users can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings for their reservations" ON ratings FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM reservations 
    WHERE id = reservation_id AND user_id = auth.uid()
  )
);

-- Políticas para performance_reports
DROP POLICY IF EXISTS "Only admins can view performance reports" ON performance_reports;
DROP POLICY IF EXISTS "Only admins can manage performance reports" ON performance_reports;
CREATE POLICY "Only admins can view performance reports" ON performance_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Only admins can manage performance reports" ON performance_reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para pricing_rules
DROP POLICY IF EXISTS "Admins can view pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON pricing_rules;
CREATE POLICY "Admins can view pricing rules" ON pricing_rules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage pricing rules" ON pricing_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================================================
-- 5. INSERTAR DATOS DE PRUEBA
-- =============================================================================

-- Insertar tipos de servicios
INSERT INTO service_types (name, code, description, base_price, pricing_unit, includes) VALUES
('Traslado Aeropuerto - Santiago', 'airport_santiago', 'Traslado desde/hacia el aeropuerto con recepción personalizada', 25000, 'fixed', '["Peajes", "Tags", "Estacionamientos", "Letrero corporativo", "Seguimiento GPS"]'),
('Traslado dentro de Santiago', 'city_km', 'Traslado urbano con tarifa por kilómetro', 800, 'per_km', '["Seguimiento GPS", "Sin recargos nocturnos"]'),
('Servicio de Encomiendas', 'package_delivery', 'Entrega de encomiendas hasta 5 kg', 8000, 'fixed', '["Hasta 5 kg", "Seguimiento GPS", "Confirmación de entrega"]'),
('Servicio de Chofer 8 horas', 'driver_8h', 'Chofer con disponibilidad completa por 8 horas', 120000, 'fixed', '["Disponibilidad completa", "Combustible", "Seguimiento GPS"]'),
('Hora Extra de Chofer', 'extra_hour', 'Hora adicional de servicio', 15000, 'per_hour', '["Combustible", "Seguimiento GPS"]'),
('Tiempo de Espera', 'waiting_time', 'Tiempo de espera adicional a partir de 30 minutos', 5000, 'per_30min', '["A partir de 30 minutos"]'),
('Vehículo de Emergencia', 'emergency_vehicle', 'Servicio express bajo solicitud', 30000, 'fixed', '["Servicio express", "Respuesta inmediata", "Seguimiento GPS"]')
ON CONFLICT (code) DO NOTHING;

-- Insertar categorías de vehículos
INSERT INTO vehicle_categories (name, code, description, max_passengers, luggage_capacity, features, base_price_multiplier, examples) VALUES
('Sedán Ejecutivo', 'sedan_ejecutivo', 'Vehículo sedán cómodo para ejecutivos', 4, '2 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional"]', 1.0, '["Toyota Corolla", "Nissan Sentra", "Hyundai Elantra"]'),
('Sedán de Lujo', 'sedan_lujo', 'Vehículo sedán premium para servicios especiales', 4, '2 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional", "Asientos de cuero", "WiFi"]', 1.5, '["Mercedes Benz E220", "BMW Serie 3", "Audi A4"]'),
('Minivan Ejecutiva', 'minivan_ejecutiva', 'Vehículo espacioso para grupos pequeños', 8, '4 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional", "Espacio adicional"]', 1.3, '["Kia Grand Carnival", "Toyota Hiace", "Hyundai H1"]'),
('Minivan de Lujo', 'minivan_lujo', 'Vehículo premium para grupos que requieren comodidad superior', 8, '4 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional", "Asientos de cuero", "WiFi", "Entretenimiento"]', 1.8, '["Mercedes V-Class", "BMW X7", "Audi Q7"]'),
('SUV Ejecutiva', 'suv_ejecutiva', 'Vehículo SUV para comodidad y versatilidad', 7, '3 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional", "Tracción 4x4", "Altura superior"]', 1.4, '["Hyundai Santa Fe", "Toyota RAV4", "Kia Sorento"]'),
('Sprinter', 'sprinter', 'Vehículo de alta capacidad para grupos grandes', 19, '8 maletas grandes', '["Aire acondicionado", "GPS", "Seguro por asiento", "Conductor profesional", "Espacio amplio", "Acceso fácil"]', 2.0, '["Mercedes Sprinter", "Ford Transit", "Iveco Daily"]')
ON CONFLICT (code) DO NOTHING;

-- Insertar conductores de prueba
INSERT INTO drivers (full_name, phone, email, license_number, license_type, experience_years, vehicle_info, certifications, is_active) VALUES
('Juan Pérez Morales', '+56912345678', 'juan.perez@transportestorres.cl', 'LIC12345678', 'A-2', 5, 
 '{"brand": "Toyota", "model": "Corolla", "year": 2022, "color": "Blanco", "plate": "HJKL89", "category": "sedan_ejecutivo", "max_passengers": 4, "kilometers": 45000, "has_gps": true, "insurance_per_seat": true}', 
 '{"road_safety": true, "customer_service": true, "transport_regulations": true, "last_training_date": "2024-01-15"}', true),
('María González Silva', '+56987654321', 'maria.gonzalez@transportestorres.cl', 'LIC87654321', 'A-2', 3, 
 '{"brand": "Mercedes", "model": "E220", "year": 2023, "color": "Negro", "plate": "MNOP34", "category": "sedan_lujo", "max_passengers": 4, "kilometers": 25000, "has_gps": true, "insurance_per_seat": true}', 
 '{"road_safety": true, "customer_service": true, "transport_regulations": true, "last_training_date": "2024-01-10"}', true),
('Carlos Rodríguez Jiménez', '+56955667788', 'carlos.rodriguez@transportestorres.cl', 'LIC11223344', 'A-2', 7, 
 '{"brand": "Kia", "model": "Grand Carnival", "year": 2021, "color": "Gris", "plate": "QRST56", "category": "minivan_ejecutiva", "max_passengers": 8, "kilometers": 78000, "has_gps": true, "insurance_per_seat": true}', 
 '{"road_safety": true, "customer_service": true, "transport_regulations": true, "last_training_date": "2024-01-20"}', true),
('Ana López Torres', '+56933445566', 'ana.lopez@transportestorres.cl', 'LIC55667788', 'A-2', 4, 
 '{"brand": "Hyundai", "model": "Santa Fe", "year": 2022, "color": "Azul", "plate": "UVWX12", "category": "suv_ejecutiva", "max_passengers": 7, "kilometers": 35000, "has_gps": true, "insurance_per_seat": true}', 
 '{"road_safety": true, "customer_service": true, "transport_regulations": true, "last_training_date": "2024-01-12"}', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar viajes de prueba
INSERT INTO trips (origin, destination, departure_time, estimated_duration, service_type_id, price, max_passengers, driver_id, vehicle_category, status, includes_tolls, includes_parking, gps_tracking) VALUES
('Aeropuerto Arturo Merino Benítez', 'Las Condes, Santiago', '2024-02-15 08:00:00+00', 45, (SELECT id FROM service_types WHERE code = 'airport_santiago'), 25000, 4, (SELECT id FROM drivers WHERE email = 'juan.perez@transportestorres.cl'), 'sedan_ejecutivo', 'available', true, true, true),
('Centro de Santiago', 'Providencia', '2024-02-15 10:00:00+00', 25, (SELECT id FROM service_types WHERE code = 'city_km'), 8000, 4, (SELECT id FROM drivers WHERE email = 'maria.gonzalez@transportestorres.cl'), 'sedan_lujo', 'available', false, false, true),
('Universidad de Chile', 'Mall Costanera Center', '2024-02-15 14:00:00+00', 35, (SELECT id FROM service_types WHERE code = 'city_km'), 10500, 8, (SELECT id FROM drivers WHERE email = 'carlos.rodriguez@transportestorres.cl'), 'minivan_ejecutiva', 'available', false, true, true),
('Hotel Marriott', 'Aeropuerto Arturo Merino Benítez', '2024-02-16 06:30:00+00', 50, (SELECT id FROM service_types WHERE code = 'airport_santiago'), 25000, 7, (SELECT id FROM drivers WHERE email = 'ana.lopez@transportestorres.cl'), 'suv_ejecutiva', 'available', true, true, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- MIGRACIÓN COMPLETADA ✅
-- =============================================================================

-- Verificar que todo se creó correctamente
SELECT 'MIGRACIÓN COMPLETADA - Verificando tablas creadas:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name; 