-- SCRIPT DE PRUEBA INMEDIATA - SISTEMA DE CORREOS
-- Ejecutar este script en Supabase SQL Editor para probar correos SIN configurar Gmail

-- =============================================================================
-- 1. VERIFICAR QUE TODO ESTÉ LISTO
-- =============================================================================

SELECT 'Verificando sistema...' as step;

-- Verificar plantillas de correo
SELECT 'Plantillas disponibles:' as info;
SELECT template_name, is_active FROM email_templates;

-- Verificar reservas existentes
SELECT 'Reservas disponibles para probar:' as info;
SELECT id, confirmation_code, status, pickup_location, dropoff_location 
FROM reservations 
ORDER BY created_at DESC 
LIMIT 3;

-- =============================================================================
-- 2. FUNCIÓN DE PRUEBA SIMPLE
-- =============================================================================

CREATE OR REPLACE FUNCTION quick_email_test(
  p_test_email TEXT DEFAULT 'test@example.com'
)
RETURNS TABLE(
  step_number INT,
  step_description TEXT,
  result TEXT
) AS $$
DECLARE
  v_reservation_id UUID;
  v_log_id UUID;
BEGIN
  -- Paso 1: Buscar reserva
  RETURN QUERY SELECT 1, 'Buscando reserva de prueba...', 'Iniciando';
  
  SELECT r.id INTO v_reservation_id 
  FROM reservations r 
  ORDER BY r.created_at DESC 
  LIMIT 1;
  
  IF v_reservation_id IS NULL THEN
    RETURN QUERY SELECT 2, 'Error', 'No hay reservas para probar. Crea una reserva primero.';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 2, 'Reserva encontrada', v_reservation_id::TEXT;
  
  -- Paso 3: Probar envío
  RETURN QUERY SELECT 3, 'Enviando correo de prueba...', 'Procesando';
  
  BEGIN
    v_log_id := send_reservation_email_extended(
      v_reservation_id,
      'reservation_created',
      p_test_email
    );
    
    RETURN QUERY SELECT 4, 'Correo enviado', 'Log ID: ' || v_log_id::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 4, 'Error al enviar', SQLERRM;
  END;
  
  -- Paso 5: Mostrar logs
  RETURN QUERY SELECT 5, 'Ver logs más recientes', 'Consulta: SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;';
  
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. FUNCIÓN PARA PROBAR TODAS LAS PLANTILLAS
-- =============================================================================

CREATE OR REPLACE FUNCTION test_all_templates(
  p_test_email TEXT DEFAULT 'admin@transportestorres.cl'
)
RETURNS TABLE(
  template_name TEXT,
  status TEXT,
  log_id UUID
) AS $$
DECLARE
  v_reservation_id UUID;
  v_template RECORD;
  v_log_id UUID;
BEGIN
  -- Buscar reserva confirmada
  SELECT id INTO v_reservation_id 
  FROM reservations 
  WHERE status IN ('confirmed', 'pending')
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_reservation_id IS NULL THEN
    RETURN QUERY SELECT 'ERROR'::TEXT, 'No hay reservas disponibles'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Probar cada plantilla
  FOR v_template IN 
    SELECT et.template_name 
    FROM email_templates et 
    WHERE et.is_active = true
  LOOP
    BEGIN
      v_log_id := send_reservation_email_extended(
        v_reservation_id,
        v_template.template_name,
        p_test_email
      );
      
      RETURN QUERY SELECT v_template.template_name, 'ENVIADO'::TEXT, v_log_id;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_template.template_name, 'ERROR: ' || SQLERRM, NULL::UUID;
    END;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. COMANDOS DE PRUEBA LISTOS PARA USAR
-- =============================================================================

SELECT 'Sistema listo para probar' as status;

SELECT '=== COMANDOS DE PRUEBA ===' as info;

SELECT 'Para probar 1 correo:' as command_1;
SELECT 'SELECT * FROM quick_email_test(''tu-email@gmail.com'');' as example_1;

SELECT 'Para probar todas las plantillas:' as command_2;
SELECT 'SELECT * FROM test_all_templates(''tu-email@gmail.com'');' as example_2;

SELECT 'Para ver logs de correos:' as command_3;
SELECT 'SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;' as example_3;

SELECT 'Para ver plantillas disponibles:' as command_4;
SELECT 'SELECT template_name, subject FROM email_templates WHERE is_active = true;' as example_4;

-- =============================================================================
-- 5. PRUEBA AUTOMÁTICA (OPCIONAL)
-- =============================================================================

-- Descomentar la siguiente línea para probar automáticamente
-- SELECT * FROM quick_email_test('admin@transportestorres.cl');

SELECT '¡SISTEMA LISTO! Ejecuta los comandos de arriba para probar.' as final_message; 