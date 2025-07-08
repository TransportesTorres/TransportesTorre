import nodemailer from 'nodemailer';
import { supabase } from '@/supabase/supabase';
import Handlebars from 'handlebars';

// Tipos para el sistema de correos
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
  total_price: number;
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
                        <p><strong>💰 Precio Total:</strong> ${{total_price}}</p>
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
                    <p>© 2024 Transportes Torres SpA. Todos los derechos reservados.</p>
                    <p>📧 reservas@transportestorres.cl | 📱 +56 9 1234 5678</p>
                </div>
            </div>
        </body>
        </html>
        `
      },

      reservation_confirmed: {
        subject: '✅ Reserva Confirmada - {{confirmation_code}} | Transportes Torres',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: #059669; color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .header h2 { margin: 10px 0 0 0; font-size: 18px; font-weight: normal; }
                .content { padding: 30px 20px; }
                .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
                .success { background: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
                .alert { background: #fef2f2; color: #991b1b; padding: 20px; border-radius: 8px; margin: 15px 0; }
                .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
                .highlight { color: #059669; font-weight: bold; }
                .emoji { font-size: 18px; margin-right: 8px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚗 Transportes Torres</h1>
                    <h2>¡Reserva Confirmada!</h2>
                </div>
                
                <div class="content">
                    <p>Estimado/a <strong>{{client_name}}</strong>,</p>
                    
                    <div class="success">
                        <span class="emoji">✅</span>
                        <strong>¡Excelente noticia! Tu reserva ha sido confirmada</strong>
                        <p>Todo está listo para tu viaje</p>
                    </div>
                    
                    <div class="info-box">
                        <h3>🎫 Detalles Confirmados</h3>
                        <p><strong>Código:</strong> <span class="highlight">{{confirmation_code}}</span></p>
                        <p><strong>📍 Origen:</strong> {{pickup_location}}</p>
                        <p><strong>📍 Destino:</strong> {{dropoff_location}}</p>
                        <p><strong>👥 Pasajeros:</strong> {{passenger_count}}</p>
                        <p><strong>💰 Precio:</strong> ${{total_price}}</p>
                        {{#if driver_name}}
                        <p><strong>🚗 Conductor:</strong> {{driver_name}}</p>
                        {{/if}}
                    </div>
                    
                    <div class="alert">
                        <h3>📱 Próximos Pasos</h3>
                        <p><strong>Nos comunicaremos contigo 24 horas antes del viaje para coordinar:</strong></p>
                        <ul>
                            <li>⏰ Hora exacta de recogida</li>
                            <li>🚗 Información completa del conductor</li>
                            <li>🚙 Datos del vehículo</li>
                            <li>📍 Punto de encuentro específico</li>
                            <li>📞 Teléfono directo del conductor</li>
                        </ul>
                    </div>
                    
                    <div class="info-box">
                        <h3>📞 Contacto Inmediato</h3>
                        <p>Si tienes alguna pregunta o necesitas cambiar algo:</p>
                        <p><strong>📱 WhatsApp:</strong> +56 9 1234 5678</p>
                        <p><strong>📧 Email:</strong> reservas@transportestorres.cl</p>
                        <p><strong>🔑 Tu Código:</strong> {{confirmation_code}}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>¡Gracias por elegir Transportes Torres!</p>
                    <p>© 2024 Transportes Torres SpA</p>
                </div>
            </div>
        </body>
        </html>
        `
      },

      new_reservation_admin: {
        subject: '🔔 Nueva Reserva Pendiente - {{confirmation_code}} | Admin Dashboard',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .urgent { background: #fee2e2; color: #991b1b; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
                .info-box { background: #fef9e7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
                .button { background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 15px 0; }
                .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚗 Transportes Torres - Admin</h1>
                    <h2>Nueva Reserva Pendiente</h2>
                </div>
                
                <div class="content">
                    <div class="urgent">
                        <h3>⚠️ ACCIÓN REQUERIDA</h3>
                        <p>Nueva reserva pendiente de confirmación en el sistema.</p>
                    </div>
                    
                    <div class="info-box">
                        <h3>📋 Detalles de la Reserva</h3>
                        <p><strong>Código:</strong> {{confirmation_code}}</p>
                        <p><strong>👤 Cliente:</strong> {{client_name}}</p>
                        <p><strong>📍 Origen:</strong> {{pickup_location}}</p>
                        <p><strong>📍 Destino:</strong> {{dropoff_location}}</p>
                        <p><strong>👥 Pasajeros:</strong> {{passenger_count}}</p>
                        <p><strong>💰 Precio:</strong> ${{total_price}}</p>
                        <p><strong>📞 Teléfono:</strong> {{contact_phone}}</p>
                        {{#if flight_number}}
                        <p><strong>✈️ Vuelo:</strong> {{flight_number}}</p>
                        {{/if}}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="/dashboard/admin/reservations" class="button">
                            🖥️ Ir al Dashboard Admin
                        </a>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Sistema de Gestión - Transportes Torres</p>
                </div>
            </div>
        </body>
        </html>
        `
      },

      trip_assigned_driver: {
        subject: '🚗 Nuevo Viaje Asignado - {{confirmation_code}} | Transportes Torres',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: #1f2937; color: white; padding: 30px 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .info-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .status { background: #dbeafe; color: #1e40af; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
                .client-info { background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; margin: 15px 0; }
                .important { background: #fee2e2; color: #991b1b; padding: 20px; border-radius: 8px; margin: 15px 0; }
                .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚗 Transportes Torres</h1>
                    <h2>Nuevo Viaje Asignado</h2>
                </div>
                
                <div class="content">
                    <p>Estimado conductor <strong>{{driver_name}}</strong>,</p>
                    
                    <div class="status">
                        <h3>📋 Código de Reserva: {{confirmation_code}}</h3>
                        <p>Estado: <strong>Confirmado - Listo para ejecutar</strong></p>
                    </div>
                    
                    <div class="info-box">
                        <h3>🗺️ Detalles del Viaje</h3>
                        <p><strong>📍 Origen:</strong> {{pickup_location}}</p>
                        <p><strong>📍 Destino:</strong> {{dropoff_location}}</p>
                        <p><strong>👥 Pasajeros:</strong> {{passenger_count}}</p>
                        <p><strong>💰 Valor:</strong> ${{total_price}}</p>
                    </div>
                    
                    <div class="client-info">
                        <h3>👤 Información del Cliente</h3>
                        <p><strong>Nombre:</strong> {{client_name}}</p>
                        <p><strong>📞 Teléfono:</strong> {{contact_phone}}</p>
                        {{#if flight_number}}
                        <p><strong>✈️ Vuelo:</strong> {{flight_number}}</p>
                        {{/if}}
                    </div>
                    
                    <div class="important">
                        <h3>📱 PROTOCOLO IMPORTANTE</h3>
                        <ul>
                            <li>📞 <strong>Contacta al cliente 30 minutos antes</strong></li>
                            <li>📍 <strong>Confirma la ubicación exacta</strong></li>
                            <li>⏰ <strong>Llega 10 minutos antes</strong></li>
                            <li>🚗 <strong>Marca como "En progreso" al iniciar</strong></li>
                            <li>✅ <strong>Marca como "Completado" al finalizar</strong></li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p>¡Buen viaje y manejo seguro!</p>
                    <p>© 2024 Transportes Torres SpA</p>
                </div>
            </div>
        </body>
        </html>
        `
      },

      trip_completed: {
        subject: '✅ Viaje Completado - {{confirmation_code}} | Transportes Torres',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: #059669; color: white; padding: 30px 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .success { background: #d1fae5; color: #065f46; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
                .rating { background: #fffbeb; color: #92400e; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
                .stars { font-size: 24px; color: #fbbf24; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚗 Transportes Torres</h1>
                    <h2>¡Viaje Completado Exitosamente!</h2>
                </div>
                
                <div class="content">
                    <p>Estimado/a <strong>{{client_name}}</strong>,</p>
                    
                    <div class="success">
                        <h3>✅ ¡Tu viaje se ha completado exitosamente!</h3>
                        <p>Esperamos que hayas tenido una excelente experiencia</p>
                        <p>Código de confirmación: <strong>{{confirmation_code}}</strong></p>
                    </div>
                    
                    <div class="info-box">
                        <h3>📋 Resumen del Viaje</h3>
                        <p><strong>🎫 Código:</strong> {{confirmation_code}}</p>
                        <p><strong>📍 Ruta:</strong> {{pickup_location}} → {{dropoff_location}}</p>
                        {{#if driver_name}}
                        <p><strong>🚗 Conductor:</strong> {{driver_name}}</p>
                        {{/if}}
                        <p><strong>👥 Pasajeros:</strong> {{passenger_count}}</p>
                        <p><strong>💰 Precio:</strong> ${{total_price}}</p>
                    </div>
                    
                    <div class="rating">
                        <h3>⭐ ¿Qué te pareció el servicio?</h3>
                        <div class="stars">⭐⭐⭐⭐⭐</div>
                        <p>Tu opinión es muy importante para nosotros</p>
                        <p><strong>📱 WhatsApp:</strong> +56 9 1234 5678</p>
                        <p><strong>📧 Email:</strong> feedback@transportestorres.cl</p>
                    </div>
                    
                    <div class="info-box">
                        <h3>🎉 ¡Gracias por elegir Transportes Torres!</h3>
                        <p>Para futuras reservas:</p>
                        <p>📧 reservas@transportestorres.cl</p>
                        <p>📱 +56 9 1234 5678</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>¡Gracias por confiar en nosotros!</p>
                    <p>© 2024 Transportes Torres SpA</p>
                </div>
            </div>
        </body>
        </html>
        `
      }
    };
  }

  // Compilar plantilla con Handlebars
  private compileTemplate(template: string, data: ReservationEmailData): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  }

  // Enviar correo
  async sendEmail(
    to: string,
    templateName: string,
    data: ReservationEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templates = this.getTemplates();
      const template = templates[templateName];
      
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Compilar plantillas
      const subject = this.compileTemplate(template.subject, data);
      const html = this.compileTemplate(template.html, data);

      // Configurar correo
      const mailOptions = {
        from: `"Transportes Torres" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      // Enviar correo
      const info = await this.transporter.sendMail(mailOptions);

      // Guardar log en base de datos
      await this.saveEmailLog({
        recipient_email: to,
        template_name: templateName,
        subject,
        status: 'sent',
        message_id: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Guardar error en base de datos
      await this.saveEmailLog({
        recipient_email: to,
        template_name: templateName,
        subject: `Error: ${templateName}`,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Guardar log de email en base de datos
  private async saveEmailLog(logData: {
    recipient_email: string;
    template_name: string;
    subject: string;
    status: string;
    message_id?: string;
    error_message?: string;
  }) {
    try {
      await this.supabaseClient.from('email_logs').insert({
        ...logData,
        sent_at: logData.status === 'sent' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error saving email log:', error);
    }
  }

  // Obtener datos de reserva completos
  async getReservationData(reservationId: string): Promise<ReservationEmailData | null> {
    try {
      console.log('Fetching reservation data for ID:', reservationId);
      
      // Primero obtener la reserva básica
      const { data: reservation, error: reservationError } = await this.supabaseClient
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (reservationError || !reservation) {
        console.error('Error fetching reservation:', reservationError);
        return null;
      }

      console.log('Reservation found:', reservation);

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
        total_price: reservation.total_price,
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