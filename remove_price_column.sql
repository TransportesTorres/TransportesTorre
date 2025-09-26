-- Migración para eliminar la columna price de la tabla trips
-- Fecha: 2025-01-08
-- Motivo: La aplicación ya no maneja precios

BEGIN;

-- Eliminar la columna price de la tabla trips
ALTER TABLE trips DROP COLUMN IF EXISTS price;

-- Verificar que la tabla sigue funcionando correctamente
-- (Opcional: hacer un SELECT para verificar estructura)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
ORDER BY ordinal_position;

COMMIT;

-- Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE 'Columna price eliminada exitosamente de la tabla trips';
END $$; 