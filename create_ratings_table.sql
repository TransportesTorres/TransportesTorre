-- Crear tabla de ratings para calificar viajes
-- Fecha: 2025-01-08

CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  overall_rating integer NOT NULL,
  punctuality_rating integer NOT NULL,
  vehicle_condition_rating integer NOT NULL,
  driver_service_rating integer NOT NULL,
  comment text NULL,
  would_recommend boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations (id),
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id),
  CONSTRAINT ratings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers (id),
  
  -- Constraints para asegurar ratings entre 1 y 5
  CONSTRAINT ratings_overall_rating_check CHECK (overall_rating >= 1 AND overall_rating <= 5),
  CONSTRAINT ratings_punctuality_rating_check CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  CONSTRAINT ratings_vehicle_condition_rating_check CHECK (vehicle_condition_rating >= 1 AND vehicle_condition_rating <= 5),
  CONSTRAINT ratings_driver_service_rating_check CHECK (driver_service_rating >= 1 AND driver_service_rating <= 5)
) TABLESPACE pg_default;

-- Índices para mejorar rendimiento
CREATE INDEX ratings_reservation_id_idx ON public.ratings USING btree (reservation_id);
CREATE INDEX ratings_user_id_idx ON public.ratings USING btree (user_id);
CREATE INDEX ratings_driver_id_idx ON public.ratings USING btree (driver_id);
CREATE INDEX ratings_created_at_idx ON public.ratings USING btree (created_at);

-- RLS (Row Level Security) - Los usuarios solo pueden ver sus propios ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios ratings
CREATE POLICY "Users can view own ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan crear ratings de sus propias reservas
CREATE POLICY "Users can create ratings for own reservations" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE reservations.id = reservation_id 
      AND reservations.user_id = auth.uid()
    )
  );

-- Política para que los admins vean todos los ratings
CREATE POLICY "Admins can view all ratings" ON public.ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Mensaje de confirmación
SELECT 'Tabla ratings creada exitosamente con políticas RLS' as message; 