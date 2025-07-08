-- VERIFICAR Y CREAR TABLA RESERVATIONS SI NO EXISTE
-- Ejecutar este script en Supabase SQL Editor si hay problemas con las reservas

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para generar código de confirmación si no existe
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de confirmación en reservas si no existe
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code = generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear tabla reservations si no existe
CREATE TABLE IF NOT EXISTS reservations (
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
  flight_number TEXT,
  waiting_time INTEGER DEFAULT 0,
  extra_stops JSONB DEFAULT '[]',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  confirmation_code TEXT UNIQUE NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage reservations" ON reservations;

-- Crear políticas de RLS
CREATE POLICY "Users can view their own reservations" ON reservations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON reservations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON reservations 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage reservations" ON reservations 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Crear triggers si no existen
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at 
BEFORE UPDATE ON reservations 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS set_reservation_confirmation_code ON reservations;
CREATE TRIGGER set_reservation_confirmation_code 
BEFORE INSERT ON reservations 
FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();

-- Verificar que la tabla existe
SELECT 'Tabla reservations verificada exitosamente' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reservations'; 