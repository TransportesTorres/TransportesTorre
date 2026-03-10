import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

interface SimpleReservationData {
  client_name: string;
  client_email?: string;
  confirmation_code: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_count: number;
  contact_phone: string;
  flight_number?: string;
  special_requirements?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_info?: string;
  trip_origin?: string;
  trip_destination?: string;
  departure_time?: string;
  reservation_status?: string;
  pickup_time?: string;
  service_date?: string;
  rating_url?: string;
}

// Crear transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    // Configuraciones adicionales para servidores profesionales
    tls: {
      // No fallar en certificados autofirmados
      rejectUnauthorized: false
    }
  });
}

// Generar plantillas con template literals
function generateEmailTemplate(templateName: string, data: SimpleReservationData) {
  const templates = {
    reservation_confirmed: {
      subject: `✅ Reserva Confirmada - ${data.confirmation_code} | Transportes Torres`,
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
              .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
              .success { background: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
              .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Transportes Torres</h1>
                  <h2>¡Reserva Confirmada!</h2>
              </div>
              
              <div class="content">
                  <p>Estimado/a <strong>${data.client_name}</strong>,</p>
                  
                  <div class="success">
                      <h3>✅ ¡Excelente noticia! Tu reserva ha sido confirmada</h3>
                      <p>Estamos procesando tu solicitud</p>
                      <p><strong>⏳ Espere por la asignación del chofer para completar totalmente su reserva</strong></p>
                  </div>
                  
                  <div class="info-box">
                      <h3>🎫 Detalles Confirmados</h3>
                      <p><strong>Código:</strong> ${data.confirmation_code}</p>
                      <p><strong>📍 Origen:</strong> ${data.pickup_location}</p>
                      <p><strong>📍 Destino:</strong> ${data.dropoff_location}</p>
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                      ${data.driver_name ? `<p><strong>🚗 Conductor:</strong> ${data.driver_name}</p>` : ''}
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>📞 Contacto</h3>
                      <p><strong>📱 WhatsApp:</strong> +56 9 73060444</p>
                      <p><strong>📧 Email:</strong> reservas@viajestorres.cl</p>
                      <p><strong>🔑 Tu Código:</strong> ${data.confirmation_code}</p>
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

    trip_assigned_driver: {
      subject: `🚗 Nuevo Viaje Asignado - ${data.confirmation_code} | Transportes Torres`,
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
                  <div class="status">
                      <h3>📋 Código de Reserva: ${data.confirmation_code}</h3>
                      <p>Estado: <strong>Confirmado - Listo para ejecutar</strong></p>
                  </div>
                  
                  <div class="info-box">
                      <h3>🗺️ Detalles del Viaje</h3>
                      <p><strong>📍 Origen:</strong> ${data.pickup_location}</p>
                      <p><strong>📍 Destino:</strong> ${data.dropoff_location}</p>
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                      ${data.special_requirements ? `<p><strong>📝 Requerimientos especiales:</strong> ${data.special_requirements}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>👤 Información del Cliente</h3>
                      <p><strong>Nombre:</strong> ${data.client_name}</p>
                      <p><strong>📞 Teléfono:</strong> ${data.contact_phone}</p>
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>📞 Contacto de Emergencia</h3>
                      <p><strong>📱 Central:</strong> +56 9 73060444</p>
                      <p><strong>📧 Soporte:</strong> reservas@viajestorres.cl</p>
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
      subject: `🎉 Viaje Completado - ${data.confirmation_code} | Transportes Torres`,
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
              .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
              .success { background: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
              .rating { background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
              .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
              .stars { font-size: 24px; margin: 10px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Transportes Torres</h1>
                  <h2>¡Viaje Completado!</h2>
              </div>
              
              <div class="content">
                  <p>Estimado/a <strong>${data.client_name}</strong>,</p>
                  
                  <div class="success">
                      <h3>✅ ¡Tu viaje se ha completado exitosamente!</h3>
                      <p>Esperamos que hayas tenido una excelente experiencia</p>
                      <p>Código de confirmación: <strong>${data.confirmation_code}</strong></p>
                  </div>
                  
                  <div class="info-box">
                      <h3>📋 Resumen del Viaje</h3>
                      <p><strong>🎫 Código:</strong> ${data.confirmation_code}</p>
                      <p><strong>📍 Ruta:</strong> ${data.pickup_location} → ${data.dropoff_location}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                      ${data.driver_name ? `<p><strong>🚗 Conductor:</strong> ${data.driver_name}</p>` : ''}
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
                  
                  <div class="rating">
                      <h3>⭐ ¿Qué te pareció el servicio?</h3>
                      <div class="stars">⭐⭐⭐⭐⭐</div>
                      <p>Tu opinión es muy importante para nosotros</p>
                      ${data.rating_url ? `
                        <div style="margin: 20px 0;">
                          <a href="${data.rating_url}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                            📝 Calificar Mi Viaje
                          </a>
                        </div>
                        <p style="font-size: 14px; color: #666;">Haz clic en el botón para dejar tu calificación</p>
                      ` : `
                        <p><strong>📱 WhatsApp:</strong> +56 9 73060444</p>
                        <p><strong>📧 Email:</strong> reservas@viajestorres.cl</p>
                      `}
                  </div>
                  
                  <div class="info-box">
                      <h3>🎉 ¡Gracias por elegir Transportes Torres!</h3>
                      <p>Para futuras reservas:</p>
                      <p>📧 reservas@viajestorres.cl</p>
                      <p>📱 +56 9 73060444</p>
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
    },

    new_reservation_admin: {
      subject: `🆕 Nueva Reserva - ${data.confirmation_code} | Transportes Torres`,
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
              .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Transportes Torres</h1>
                  <h2>Nueva Reserva Confirmada</h2>
              </div>
              
              <div class="content">
                  <div class="status">
                      <h3>📋 Código de Reserva: ${data.confirmation_code}</h3>
                      <p>Estado: <strong>Confirmado - Listo para aprobar</strong></p>
                  </div>
                  
                  <div class="info-box">
                      <h3>🗺️ Detalles de la Reserva</h3>
                      <p><strong>👤 Cliente:</strong> ${data.client_name}</p>
                      <p><strong>📍 Origen:</strong> ${data.pickup_location}</p>
                      <p><strong>📍 Destino:</strong> ${data.dropoff_location}</p>
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>📞 Contacto del Cliente</h3>
                      <p><strong>📞 Teléfono:</strong> ${data.contact_phone}</p>
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
              </div>
              
              <div class="footer">
                  <p>© 2024 Transportes Torres SpA</p>
              </div>
          </div>
      </body>
      </html>
      `
    },

    driver_assigned: {
      subject: `🚗 Conductor Asignado - ${data.confirmation_code} | Transportes Torres`,
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
              .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
              .success { background: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
              .driver-box { background: #dbeafe; color: #1e40af; padding: 20px; border-radius: 8px; margin: 15px 0; }
              .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Transportes Torres</h1>
                  <h2>¡Conductor Asignado!</h2>
              </div>
              
              <div class="content">
                  <p>Estimado/a <strong>${data.client_name}</strong>,</p>
                  
                  <div class="success">
                      <h3>✅ ¡Su reserva está completamente confirmada!</h3>
                      <p>Hemos asignado un conductor para su viaje</p>
                      <p>Código de confirmación: <strong>${data.confirmation_code}</strong></p>
                  </div>
                  
                  <div class="driver-box">
                      <h3>👨‍✈️ Su Conductor Asignado</h3>
                      <p><strong>Nombre:</strong> ${data.driver_name}</p>
                      <p><strong>📞 Teléfono:</strong> ${data.driver_phone}</p>
                      ${data.vehicle_info ? `<p><strong>🚗 Vehículo:</strong> ${data.vehicle_info}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>🎫 Detalles del Viaje</h3>
                      <p><strong>Código:</strong> ${data.confirmation_code}</p>
                      <p><strong>📍 Origen:</strong> ${data.pickup_location}</p>
                      <p><strong>📍 Destino:</strong> ${data.dropoff_location}</p>
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>📞 Contacto de Emergencia</h3>
                      <p><strong>📱 Central:</strong> +56 9 73060444</p>
                      <p><strong>📧 Email:</strong> reservas@viajestorres.cl</p>
                  </div>
              </div>
              
              <div class="footer">
                  <p>¡Buen viaje!</p>
                  <p>© 2024 Transportes Torres SpA</p>
              </div>
          </div>
      </body>
      </html>
      `
    },

    trip_cancelled: {
      subject: `❌ Viaje Cancelado - ${data.confirmation_code} | Transportes Torres`,
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
              .info-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #92400e; }
              .warning { background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
              .footer { background: #1f2937; color: #e5e7eb; padding: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Transportes Torres</h1>
                  <h2>Viaje Cancelado</h2>
              </div>
              
              <div class="content">
                  <p>Estimado/a <strong>${data.client_name}</strong>,</p>
                  
                  <div class="warning">
                      <h3>❌ ¡Tu viaje ha sido cancelado!</h3>
                      <p>El motivo de la cancelación es: ${data.reservation_status || 'No especificado'}.</p>
                      <p>Código de confirmación: <strong>${data.confirmation_code}</strong></p>
                  </div>
                  
                  <div class="info-box">
                      <h3>📋 Resumen del Viaje</h3>
                      <p><strong>🎫 Código:</strong> ${data.confirmation_code}</p>
                      <p><strong>📍 Ruta:</strong> ${data.pickup_location} → ${data.dropoff_location}</p>
                      ${data.service_date ? `<p><strong>📅 Fecha:</strong> ${data.service_date}</p>` : ''}
                      ${data.pickup_time ? `<p><strong>🕐 Hora de Recogida:</strong> ${data.pickup_time}</p>` : ''}
                      ${data.driver_name ? `<p><strong>🚗 Conductor:</strong> ${data.driver_name}</p>` : ''}
                      <p><strong>👥 Pasajeros:</strong> ${data.passenger_count}</p>
                      ${data.flight_number ? `<p><strong>✈️ Vuelo:</strong> ${data.flight_number}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                      <h3>📞 Contacto de Emergencia</h3>
                      <p><strong>📱 Central:</strong> +56 9 73060444</p>
                      <p><strong>📧 Soporte:</strong> reservas@viajestorres.cl</p>
                  </div>
              </div>
              
              <div class="footer">
                  <p>© 2024 Transportes Torres SpA</p>
              </div>
          </div>
      </body>
      </html>
      `
    }
  };

  return templates[templateName as keyof typeof templates];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { templateName, recipientEmail, reservationData } = await request.json();

    if (!templateName || !recipientEmail || !reservationData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateName, recipientEmail, reservationData' },
        { status: 400 }
      );
    }

    

    const template = generateEmailTemplate(templateName, reservationData);
    
    if (!template) {
      return NextResponse.json(
        { error: `Template ${templateName} not found` },
        { status: 400 }
      );
    }

    // Crear transporter y enviar correo
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Transportes Torres" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);

    

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Simple email API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
} 
