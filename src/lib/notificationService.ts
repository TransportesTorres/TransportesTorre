import { twilioConfig, formatWhatsAppNumber } from './twilioClient';
import emailService from './emailService';
import { supabase } from '@/supabase/supabase';

// Tipos para el sistema de notificaciones
export interface NotificationData {
  client_name: string;
  confirmation_code: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_count: number;
  total_price?: number;
  contact_phone: string;
  flight_number?: string;
  special_requirements?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_info?: string;
  pickup_time?: string;
  service_date?: string;
  rating_url?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'whatsapp' | 'sms';
  messageId?: string;
  error?: string;
}

export type NotificationTemplate = 
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'new_reservation_admin'
  | 'trip_assigned_driver'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'driver_assigned';

class NotificationService {
  private shouldUseWhatsAppTemplates(): boolean {
    return process.env.TWILIO_WHATSAPP_USE_TEMPLATES !== 'false';
  }

  private getWhatsAppTemplateSid(templateName: NotificationTemplate): string | null {
    switch (templateName) {
      case 'reservation_created':
        return process.env.TWILIO_WA_TEMPLATE_RESERVA_CREADA_SID || null;
      case 'reservation_confirmed':
        return process.env.TWILIO_WA_TEMPLATE_RESERVA_CONFIRMADA_SID || null;
      case 'new_reservation_admin':
        return process.env.TWILIO_WA_TEMPLATE_NUEVA_RESERVA_ADMIN_SID || null;
      case 'trip_assigned_driver':
        return process.env.TWILIO_WA_TEMPLATE_VIAJE_ASIGNADO_CONDUCTOR_SID || null;
      case 'driver_assigned':
        return process.env.TWILIO_WA_TEMPLATE_CONDUCTOR_ASIGNADO_CLIENTE_SID || null;
      case 'trip_completed':
        return process.env.TWILIO_WA_TEMPLATE_VIAJE_COMPLETADO_CLIENTE_SID || null;
      case 'trip_cancelled':
        return process.env.TWILIO_WA_TEMPLATE_RESERVA_CANCELADA_SID || null;
      default:
        return null;
    }
  }

  private normalizeValue(value: string | number | undefined | null, fallback: string = '-'): string {
    if (value === undefined || value === null || String(value).trim().length === 0) {
      return fallback;
    }
    return String(value);
  }

  private getWhatsAppTemplateVariables(
    templateName: NotificationTemplate,
    data: NotificationData
  ): Record<string, string> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const ratingUrl =
      data.rating_url ||
      (appUrl ? `${appUrl}/rating/${encodeURIComponent(data.confirmation_code)}` : '-');

    switch (templateName) {
      case 'reservation_created':
        return {
          '1': this.normalizeValue(data.client_name),
          '2': this.normalizeValue(data.confirmation_code),
          '3': this.normalizeValue(data.pickup_location),
          '4': this.normalizeValue(data.dropoff_location),
          '5': this.normalizeValue(data.passenger_count),
          '6': this.normalizeValue(data.pickup_time, 'Por confirmar')
        };
      case 'reservation_confirmed':
        return {
          '1': this.normalizeValue(data.client_name),
          '2': this.normalizeValue(data.confirmation_code),
          '3': this.normalizeValue(data.pickup_location),
          '4': this.normalizeValue(data.dropoff_location),
          '5': this.normalizeValue(data.passenger_count),
          '6': this.normalizeValue(data.pickup_time, 'Por confirmar')
        };
      case 'new_reservation_admin':
        return {
          '1': this.normalizeValue(data.confirmation_code),
          '2': this.normalizeValue(data.client_name),
          '3': this.normalizeValue(data.contact_phone),
          '4': this.normalizeValue(data.pickup_location),
          '5': this.normalizeValue(data.dropoff_location),
          '6': this.normalizeValue(data.passenger_count),
          '7': this.normalizeValue(data.flight_number, 'N/A')
        };
      case 'trip_assigned_driver':
        return {
          '1': this.normalizeValue(data.driver_name),
          '2': this.normalizeValue(data.confirmation_code),
          '3': this.normalizeValue(data.service_date, 'Por confirmar'),
          '4': this.normalizeValue(data.pickup_time, 'Por confirmar'),
          '5': this.normalizeValue(data.client_name),
          '6': this.normalizeValue(data.contact_phone),
          '7': this.normalizeValue(data.passenger_count),
          '8': this.normalizeValue(data.pickup_location),
          '9': this.normalizeValue(data.dropoff_location),
          '10': this.normalizeValue(data.flight_number, 'N/A'),
          '11': this.normalizeValue(data.special_requirements, 'N/A')
        };
      case 'driver_assigned':
        return {
          '1': this.normalizeValue(data.client_name),
          '2': this.normalizeValue(data.driver_name),
          '3': this.normalizeValue(data.driver_phone),
          '4': this.normalizeValue(data.vehicle_info),
          '5': this.normalizeValue(data.confirmation_code),
          '6': this.normalizeValue(data.service_date, 'Por confirmar'),
          '7': this.normalizeValue(data.pickup_time, 'Por confirmar'),
          '8': this.normalizeValue(data.pickup_location),
          '9': this.normalizeValue(data.dropoff_location)
        };
      case 'trip_completed':
        return {
          '1': this.normalizeValue(data.client_name),
          '2': this.normalizeValue(data.confirmation_code),
          '3': this.normalizeValue(data.pickup_location),
          '4': this.normalizeValue(data.dropoff_location),
          '5': this.normalizeValue(ratingUrl, 'N/A'),
          '6': this.normalizeValue(data.driver_name, 'N/A'),
          '7': this.normalizeValue(data.vehicle_info, 'N/A')
        };
      case 'trip_cancelled':
        return {};
      default:
        return {};
    }
  }
  
  // Plantillas de WhatsApp (texto plano, sin HTML)
  private getWhatsAppTemplates(): Record<NotificationTemplate, (data: NotificationData) => string> {
    return {
      reservation_created: (data) => `🚗 *Transportes Torres*

¡Hola ${data.client_name}! 

Hemos recibido tu solicitud de reserva exitosamente.

📋 *Detalles:*
• Código: *${data.confirmation_code}*
• Origen: ${data.pickup_location}
• Destino: ${data.dropoff_location}
• Pasajeros: ${data.passenger_count}
${data.pickup_time ? `• Hora: ${data.pickup_time}` : ''}

⏳ *Estado:* Pendiente de confirmación

Un administrador revisará tu solicitud pronto y te contactaremos para confirmar.

¿Dudas? Responde este mensaje 📱`,

      reservation_confirmed: (data) => `✅ *Reserva Confirmada*
🚗 Transportes Torres

¡Excelente noticia, ${data.client_name}!

Tu reserva ha sido *confirmada*.

📋 *Código:* ${data.confirmation_code}
📍 *Ruta:* ${data.pickup_location} → ${data.dropoff_location}
👥 *Pasajeros:* ${data.passenger_count}
${data.pickup_time ? `🕐 *Hora:* ${data.pickup_time}` : ''}

📱 *Próximo paso:*
Te contactaremos 24 horas antes del viaje con los datos del conductor y vehículo.

¡Gracias por elegir Transportes Torres! 🙌`,

      new_reservation_admin: (data) => `🔔 *Nueva Reserva Pendiente*
Admin Dashboard

📋 *Código:* ${data.confirmation_code}
👤 *Cliente:* ${data.client_name}
📞 *Teléfono:* ${data.contact_phone}

📍 *Origen:* ${data.pickup_location}
📍 *Destino:* ${data.dropoff_location}
👥 *Pasajeros:* ${data.passenger_count}
${data.flight_number ? `✈️ *Vuelo:* ${data.flight_number}` : ''}

⚠️ *Acción requerida:*
Ingresa al dashboard admin para confirmar o asignar conductor.`,

      trip_assigned_driver: (data) => `🚗 *Nuevo Viaje Asignado*
Transportes Torres

Hola *${data.driver_name}*,

Te hemos asignado un nuevo viaje:

📋 *Código:* ${data.confirmation_code}
👤 *Cliente:* ${data.client_name}
📞 *Contacto:* ${data.contact_phone}

📍 *Origen:* ${data.pickup_location}
📍 *Destino:* ${data.dropoff_location}
👥 *Pasajeros:* ${data.passenger_count}
${data.flight_number ? `✈️ *Vuelo:* ${data.flight_number}` : ''}

📱 *Protocolo:*
1. Contacta al cliente 30 min antes
2. Confirma ubicación exacta
3. Llega 10 minutos antes
4. Marca como "En progreso" al iniciar
5. Marca como "Completado" al finalizar

¡Buen viaje y manejo seguro! 🚗💨`,

      driver_assigned: (data) => `🚗 *Conductor Asignado*
Transportes Torres

¡Hola ${data.client_name}!

Ya tenemos conductor asignado para tu viaje:

📋 *Código:* ${data.confirmation_code}
🚗 *Conductor:* ${data.driver_name}
📞 *Teléfono conductor:* ${data.driver_phone}
🚙 *Vehículo:* ${data.vehicle_info}

📍 *Ruta:* ${data.pickup_location} → ${data.dropoff_location}
${data.pickup_time ? `🕐 *Hora:* ${data.pickup_time}` : ''}

El conductor te contactará 30 minutos antes del viaje para coordinar el punto exacto de encuentro.

¡Nos vemos pronto! 🙌`,

      trip_completed: (data) => `✅ *Viaje Completado*
🚗 Transportes Torres

¡Gracias ${data.client_name}!

Tu viaje se ha completado exitosamente.

📋 *Código:* ${data.confirmation_code}
📍 *Ruta:* ${data.pickup_location} → ${data.dropoff_location}

⭐ *Tu opinión es importante*
¿Qué te pareció el servicio?

Responde este mensaje con tu experiencia o califícanos en nuestras redes.

¡Esperamos verte pronto! 🚗💨

_Transportes Torres - Tu transporte de confianza_`,

      trip_cancelled: (data) => `❌ *Reserva Cancelada*
🚗 Transportes Torres

Hola ${data.client_name},

Lamentamos informarte que tu reserva ha sido cancelada.

📋 *Código:* ${data.confirmation_code}
📍 ${data.pickup_location} → ${data.dropoff_location}

Si deseas realizar una nueva reserva o tienes alguna consulta, contáctanos:

📞 Teléfono: [tu-numero]
📧 Email: reservas@transportestorres.cl

Disculpa las molestias.

_Equipo Transportes Torres_`
    };
  }

  // Enviar notificación por WhatsApp
  async sendWhatsApp(options: {
    to: string;
    message: string;
    templateName?: NotificationTemplate;
    useTemplates: boolean;
    data?: NotificationData;
  }): Promise<NotificationResult> {
    try {
      if (!twilioConfig.isConfigured || !twilioConfig.client) {
        console.warn('⚠️ Twilio not configured, skipping WhatsApp notification');
        return {
          success: false,
          channel: 'whatsapp',
          error: 'Twilio not configured'
        };
      }

      // Formatear número para WhatsApp
      const formattedTo = formatWhatsAppNumber(options.to);
      if (!formattedTo) {
        console.error('❌ Invalid phone number format:', options.to);
        return {
          success: false,
          channel: 'whatsapp',
          error: 'Invalid phone number format'
        };
      }

      let messageResponse;
      let messageBodyForLog = options.message;

      if (options.useTemplates && options.templateName) {
        const contentSid = this.getWhatsAppTemplateSid(options.templateName);
        if (!contentSid) {
          return {
            success: false,
            channel: 'whatsapp',
            error: `WhatsApp template SID not configured for ${options.templateName}`
          };
        }

        const variables = this.getWhatsAppTemplateVariables(
          options.templateName,
          options.data || ({} as NotificationData)
        );

        messageResponse = await twilioConfig.client.messages.create({
          from: twilioConfig.whatsappNumber,
          to: formattedTo,
          contentSid,
          contentVariables: JSON.stringify(variables)
        });

        messageBodyForLog = `TEMPLATE:${contentSid}`;
      } else {
        // Enviar mensaje de texto (sandbox o fallback)
        messageResponse = await twilioConfig.client.messages.create({
          from: twilioConfig.whatsappNumber,
          to: formattedTo,
          body: options.message
        });
      }

      console.log('✅ WhatsApp sent:', messageResponse.sid);

      // Guardar log en base de datos
      await this.saveNotificationLog({
        recipient: options.to,
        channel: 'whatsapp',
        template_name: options.templateName || 'custom',
        status: 'sent',
        message_id: messageResponse.sid,
        message_body: messageBodyForLog
      });

      return {
        success: true,
        channel: 'whatsapp',
        messageId: messageResponse.sid
      };
    } catch (error) {
      console.error('❌ WhatsApp error:', error);
      
      // Guardar error en base de datos
      await this.saveNotificationLog({
        recipient: options.to,
        channel: 'whatsapp',
        template_name: options.templateName || 'custom',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        channel: 'whatsapp',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enviar notificación completa (Email + WhatsApp)
  async sendNotification(
    recipientEmail: string,
    recipientPhone: string | undefined,
    templateName: NotificationTemplate,
    data: NotificationData,
    options?: { sendEmail?: boolean }
  ): Promise<{ email: NotificationResult; whatsapp?: NotificationResult }> {
    const results: { email: NotificationResult; whatsapp?: NotificationResult } = {
      email: { success: false, channel: 'email' }
    };

    // 1. Siempre enviar email (canal principal actual)
    const shouldSendEmail = options?.sendEmail !== false;
    if (shouldSendEmail) {
      try {
        console.log('📧 Enviando email...');
        // Convertir datos al formato esperado por emailService
        const emailData = {
          ...data,
          total_price: data.total_price || 0
        };
        const emailResult = await emailService.sendEmail(
          recipientEmail,
          templateName,
          emailData
        );
        
        results.email = {
          success: emailResult.success,
          channel: 'email',
          messageId: emailResult.messageId,
          error: emailResult.error
        };
        
        if (emailResult.success) {
          console.log('✅ Email enviado exitosamente');
        } else {
          console.error('❌ Error enviando email:', emailResult.error);
        }
      } catch (error) {
        console.error('❌ Email exception:', error);
        results.email = {
          success: false,
          channel: 'email',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      results.email = {
        success: false,
        channel: 'email',
        error: 'Email skipped'
      };
    }

    // 2. Enviar WhatsApp si hay número de teléfono
    const hasValidPhone = recipientPhone && recipientPhone.trim().length > 0;
    
    if (hasValidPhone && twilioConfig.isConfigured) {
      try {
        console.log('📱 Enviando WhatsApp a:', recipientPhone);
        const templates = this.getWhatsAppTemplates();
        const whatsappMessage = templates[templateName](data);

        results.whatsapp = await this.sendWhatsApp({
          to: recipientPhone,
          message: whatsappMessage,
          templateName,
          useTemplates: this.shouldUseWhatsAppTemplates() && templateName !== 'trip_cancelled',
          data
        });
        
        if (results.whatsapp.success) {
          console.log('✅ WhatsApp enviado exitosamente');
        } else {
          console.error('❌ Error enviando WhatsApp:', results.whatsapp.error);
        }
      } catch (error) {
        console.error('❌ WhatsApp exception:', error);
        results.whatsapp = {
          success: false,
          channel: 'whatsapp',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      const reason = !hasValidPhone ? 'Sin número de teléfono' : 'Twilio no configurado';
      console.log('⚠️ WhatsApp omitido:', reason);
      console.log('   Debug - Phone:', recipientPhone, 'Twilio configured:', twilioConfig.isConfigured);
    }

    return results;
  }

  // Guardar log de notificación en base de datos
  private async saveNotificationLog(logData: {
    recipient: string;
    channel: 'email' | 'whatsapp' | 'sms';
    template_name: string;
    status: 'sent' | 'failed';
    message_id?: string;
    message_body?: string;
    error_message?: string;
  }) {
    try {
      await supabase.from('notification_logs').insert({
        ...logData,
        sent_at: logData.status === 'sent' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error saving notification log:', error);
      // No fallar la operación principal por un error de log
    }
  }

  // Verificar configuración de Twilio
  isWhatsAppEnabled(): boolean {
    return twilioConfig.isConfigured;
  }

  // Obtener información de configuración
  getConfig() {
    return {
      whatsappEnabled: twilioConfig.isConfigured,
      whatsappNumber: twilioConfig.whatsappNumber,
      emailEnabled: true // Email siempre habilitado
    };
  }
}

// Exportar instancia singleton
const notificationService = new NotificationService();
export default notificationService;
