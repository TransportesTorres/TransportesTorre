import nodemailer from 'nodemailer';
import { supabase } from '@/supabase/supabase';

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface ReservationEmailData {
  client_name: string;
  confirmation_code: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_count: number;
  contact_phone: string;
  flight_number?: string;
  special_requirements?: string;
  driver_name?: string;
  vehicle_info?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private supabaseClient = supabase;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    return nodemailer.createTransport(config);
  }

  // Plantillas de correo profesionales
  private getTemplates(): Record<string, EmailTemplate> {
    return {
      reservation_created: {
        subject: 'Reserva Creada - Código: {{confirmation_code}} | Transportes Torres',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .header h2 { margin: 10px 0 0 0; font-size: 18px; font-weight: normal; }
                .content { padding: 30px 20px; }
                .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .status { background: #fef3c7; color: #92400e; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
                .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
                .highlight { color: #2563eb; font-weight: bold; }
                .emoji { font-size: 18px; margin-right: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚗 Transportes Torres</h1>
                    <h2>Reserva Recibida Exitosamente</h2>
                </div>
                
                <div class="content">
                    <p>Estimado/a <strong>{{client_name}}</strong>,</p>
                    
                    <p>¡Gracias por elegir Transportes Torres! Hemos recibido tu solicitud de reserva y un administrador la revisará pronto.</p>
                    
                    <div class="status">
                        <span class="emoji">📋</span>
                        <strong>Estado: Pendiente de confirmación</strong>
                    </div>
                    
                    <div class="info-box">
                        <h3>🎫 Detalles de tu Reserva</h3>
                        <p><strong>Código de Confirmación:</strong> <span class="highlight">{{confirmation_code}}</span></p>
                        <p><strong>📍 Origen:</strong> {{pickup_location}}</p>
                        <p><strong>📍 Destino:</strong> {{dropoff_location}}</p>
                        <p><strong>👥 Pasajeros:</strong> {{passenger_count}}</p>
                        <p><strong>📞 Teléfono:</strong> {{contact_phone}}</p>
                        {{#if flight_number}}
                        <p><strong>✈️ Vuelo:</strong> {{flight_number}}</p>
                        {{/if}}
                    </div>
                    
                    <div class="info-box">
                        <h3>📞 ¿Necesitas Ayuda?</h3>
                        <p>Si tienes preguntas sobre tu reserva, contáctanos:</p>
                        <p><strong>📱 WhatsApp:</strong> +56 9 1234 5678</p>
                        <p><strong>📧 Email:</strong> reservas@transportestorres.cl</p>
                        <p><strong>🔑 Código de Referencia:</strong> {{confirmation_code}}</p>
                    </div>
                    
                    <div class="info-box">
                        <h3>⏰ Próximos Pasos</h3>
                        <p>1. ✅ Revisaremos tu solicitud</p>
                        <p>2. 📧 Te confirmaremos por email y WhatsApp</p>
                        <p>3. 🚗 Te enviaremos los detalles del conductor</p>
                        <p>4. 🎉 ¡Disfruta tu viaje!</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>¡Esperamos verte pronto!</p>
                    <p>© 2024 Transportes Torres SpA</p>
                </div>
            </div>
        </body>
        </html>
        `
      }
    };
  }

  private compileTemplate(template: string, data: ReservationEmailData): string {
    let compiled = template;
    
    // Reemplazar variables simples
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (value !== undefined && value !== null) {
        compiled = compiled.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });
    
    return compiled;
  }

  async sendEmail(
    to: string,
    templateName: string,
    data: ReservationEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templates = this.getTemplates();
      const template = templates[templateName];
      
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }
      
      const compiledHtml = this.compileTemplate(template.html, data);
      const compiledSubject = this.compileTemplate(template.subject, data);
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'Transportes Torres <reservas@viajestorres.cl>',
        to: to,
        subject: compiledSubject,
        html: compiledHtml,
        text: template.text ? this.compileTemplate(template.text, data) : undefined
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      
      // Guardar log del email
      await this.saveEmailLog({
        recipient_email: to,
        template_name: templateName,
        subject: compiledSubject,
        status: 'sent',
        message_id: result.messageId
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending email:', error);
      
      // Guardar log del error
      await this.saveEmailLog({
        recipient_email: to,
        template_name: templateName,
        subject: '',
        status: 'failed',
        error_message: error.message
      });
      
      return { success: false, error: error.message };
    }
  }

  private async saveEmailLog(logData: {
    recipient_email: string;
    template_name: string;
    subject: string;
    status: string;
    message_id?: string;
    error_message?: string;
  }) {
    try {
      await this.supabaseClient
        .from('email_logs')
        .insert([{
          ...logData,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error saving email log:', error);
    }
  }

  async getReservationData(reservationId: string): Promise<ReservationEmailData | null> {
    try {
      const { data: reservation, error } = await this.supabaseClient
        .from('reservations')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error || !reservation) {
        console.error('Error fetching reservation:', error);
        return null;
      }

      // Intentar obtener datos del usuario
      let userEmail = '';
      let userName = 'Cliente';
      
      if (reservation.user_id) {
        const { data: userProfile } = await this.supabaseClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', reservation.user_id)
          .single();
        
        if (userProfile) {
          userEmail = userProfile.email || '';
          userName = userProfile.full_name || 'Cliente';
        }
      }

      // Intentar obtener datos del conductor (si existe)
      let driverName = undefined;
      let vehicleInfo = undefined;

      if (reservation.trip_id) {
        const { data: trip } = await this.supabaseClient
          .from('trips')
          .select('driver_id')
          .eq('id', reservation.trip_id)
          .single();

        if (trip && trip.driver_id) {
          const { data: driver } = await this.supabaseClient
            .from('drivers')
            .select('full_name, vehicle_info')
            .eq('id', trip.driver_id)
            .single();

          if (driver) {
            driverName = driver.full_name;
            if (driver.vehicle_info) {
              const vehicle = typeof driver.vehicle_info === 'string' 
                ? JSON.parse(driver.vehicle_info) 
                : driver.vehicle_info;
              vehicleInfo = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
            }
          }
        }
      }

      const reservationData = {
        client_name: userName,
        confirmation_code: reservation.confirmation_code,
        pickup_location: reservation.pickup_location,
        dropoff_location: reservation.dropoff_location,
        passenger_count: reservation.passenger_count,
        contact_phone: reservation.contact_phone,
        flight_number: reservation.flight_number,
        special_requirements: reservation.special_requirements,
        driver_name: driverName,
        vehicle_info: vehicleInfo
      };

      console.log('Final reservation data:', reservationData);
      return reservationData;

    } catch (error) {
      console.error('Error getting reservation data:', error);
      return null;
    }
  }

  // Enviar correo de reserva
  async sendReservationEmail(
    reservationId: string,
    templateName: string,
    recipientEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    const data = await this.getReservationData(reservationId);
    
    if (!data) {
      return { success: false, error: 'Reservation data not found' };
    }

    return await this.sendEmail(recipientEmail, templateName, data);
  }

  // Verificar configuración
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection error:', error);
      return false;
    }
  }
}

// Crear instancia singleton
const emailService = new EmailService();
export default emailService; 