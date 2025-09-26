-- Migración para agregar el estado 'assign_driver' a las tablas trips y reservations
-- Fecha: 2025-01-08
-- Motivo: Implementar flujo de dos pasos para confirmación de reservas

BEGIN;

-- Actualizar la restricción CHECK en la tabla trips para incluir 'assign_driver'
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check 
CHECK (status IN ('available', 'booked', 'assign_driver', 'completed', 'cancelled'));

-- Actualizar la restricción CHECK en la tabla reservations para incluir 'assign_driver'
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'assign_driver', 'completed', 'cancelled'));

COMMIT;

-- Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE 'Estado assign_driver agregado exitosamente a las tablas trips y reservations';
END $$; 