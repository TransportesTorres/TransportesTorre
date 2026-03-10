-- Tabla para logs de notificaciones (Email + WhatsApp + SMS)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  template_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  message_id VARCHAR(255),
  message_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template ON notification_logs(template_name);

-- RLS (Row Level Security)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo admins pueden ver logs
CREATE POLICY "Admins can view all notification logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: El sistema puede insertar logs (para la aplicación)
CREATE POLICY "System can insert notification logs"
  ON notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE notification_logs IS 'Registro de todas las notificaciones enviadas (Email, WhatsApp, SMS)';
COMMENT ON COLUMN notification_logs.recipient IS 'Email o número de teléfono del destinatario';
COMMENT ON COLUMN notification_logs.channel IS 'Canal usado: email, whatsapp, sms';
COMMENT ON COLUMN notification_logs.template_name IS 'Nombre de la plantilla usada';
COMMENT ON COLUMN notification_logs.status IS 'Estado del envío: sent, failed, pending';
COMMENT ON COLUMN notification_logs.message_id IS 'ID del mensaje en el proveedor (Twilio SID, Email Message-ID)';
COMMENT ON COLUMN notification_logs.message_body IS 'Contenido del mensaje enviado';
COMMENT ON COLUMN notification_logs.error_message IS 'Mensaje de error si falló el envío';
