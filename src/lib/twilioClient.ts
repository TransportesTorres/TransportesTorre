import twilio from 'twilio';

// Configuración del cliente Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Validar que las credenciales existan
if (!accountSid || !authToken) {
  console.warn('⚠️ Twilio credentials not configured. WhatsApp notifications will be disabled.');
}

// Crear cliente Twilio (solo si hay credenciales)
const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken) 
  : null;

// Exportar configuración
export const twilioConfig = {
  client: twilioClient,
  phoneNumber: phoneNumber || '',
  whatsappNumber: whatsappNumber || '',
  isConfigured: !!(accountSid && authToken && whatsappNumber)
};

// Función helper para validar número de teléfono chileno
export function validateChileanPhone(phone: string): string | null {
  // Limpiar el número
  const cleaned = phone.replace(/\s+/g, '').replace(/[()-]/g, '');
  
  // Patrones válidos para Chile
  // +56912345678 o 56912345678 o 912345678
  const patterns = [
    /^\+56[2-9]\d{8}$/, // +56912345678
    /^56[2-9]\d{8}$/,   // 56912345678
    /^[2-9]\d{8}$/      // 912345678
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      // Normalizar a formato internacional
      if (cleaned.startsWith('+56')) {
        return cleaned;
      } else if (cleaned.startsWith('56')) {
        return `+${cleaned}`;
      } else {
        return `+56${cleaned}`;
      }
    }
  }
  
  return null;
}

// Función helper para formatear número para WhatsApp
export function formatWhatsAppNumber(phone: string): string | null {
  const validated = validateChileanPhone(phone);
  if (!validated) return null;
  
  return `whatsapp:${validated}`;
}

export default twilioClient;
