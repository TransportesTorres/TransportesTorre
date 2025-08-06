// Funciones helper para integrar el sistema de correos con Redux

export interface EmailRequest {
  reservationId: string;
  templateName: string;
  recipientEmail: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SimpleReservationData {
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

// Enviar correo usando datos simples (sin query a la base de datos)
export async function sendSimpleReservationEmail(
  templateName: string,
  recipientEmail: string,
  reservationData: SimpleReservationData
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/email/send-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName,
        recipientEmail,
        reservationData,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send email'
      };
    }

    return {
      success: true,
      message: data.message || 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending simple email:', error);
    return {
      success: false,
      error: 'Network error while sending email'
    };
  }
}

// Enviar correo usando la API (versión original)
export async function sendReservationEmail(
  reservationId: string,
  templateName: string,
  recipientEmail: string
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        templateName,
        recipientEmail,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send email'
      };
    }

    return {
      success: true,
      message: data.message || 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: 'Network error while sending email'
    };
  }
}

// Funciones específicas para cada tipo de correo
export const emailTemplates = {
  RESERVATION_CREATED: 'reservation_created',
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  NEW_RESERVATION_ADMIN: 'new_reservation_admin',
  TRIP_ASSIGNED_DRIVER: 'trip_assigned_driver',
  TRIP_COMPLETED: 'trip_completed',
} as const;

// Función para enviar correo cuando se crea una reserva
export async function sendReservationCreatedEmail(
  reservationId: string,
  clientEmail: string
): Promise<EmailResponse> {
  return sendReservationEmail(
    reservationId,
    emailTemplates.RESERVATION_CREATED,
    clientEmail
  );
}

// Función para enviar correo cuando se confirma una reserva
export async function sendReservationConfirmedEmail(
  reservationId: string,
  clientEmail: string
): Promise<EmailResponse> {
  return sendReservationEmail(
    reservationId,
    emailTemplates.RESERVATION_CONFIRMED,
    clientEmail
  );
}

// Función simplificada para enviar correo de confirmación con datos directos
export async function sendSimpleReservationConfirmedEmail(
  clientEmail: string,
  reservationData: SimpleReservationData
): Promise<EmailResponse> {
  return sendSimpleReservationEmail(
    emailTemplates.RESERVATION_CONFIRMED,
    clientEmail,
    reservationData
  );
}

// Función para notificar al admin de nueva reserva
export async function sendNewReservationAdminEmail(
  reservationId: string,
  adminEmail: string = 'admin@transportestorres.cl'
): Promise<EmailResponse> {
  return sendReservationEmail(
    reservationId,
    emailTemplates.NEW_RESERVATION_ADMIN,
    adminEmail
  );
}

// Función para notificar al conductor
export async function sendTripAssignedDriverEmail(
  reservationId: string,
  driverEmail: string
): Promise<EmailResponse> {
  return sendReservationEmail(
    reservationId,
    emailTemplates.TRIP_ASSIGNED_DRIVER,
    driverEmail
  );
}

// Función para notificar viaje completado
export async function sendTripCompletedEmail(
  reservationId: string,
  clientEmail: string
): Promise<EmailResponse> {
  return sendReservationEmail(
    reservationId,
    emailTemplates.TRIP_COMPLETED,
    clientEmail
  );
}

// Función para enviar múltiples correos automáticamente (versión simplificada)
export async function sendSimpleAutomaticEmails(
  clientEmail: string,
  reservationData: SimpleReservationData,
  type: 'created' | 'confirmed' | 'completed',
  driverEmail?: string
): Promise<{ success: boolean; results: EmailResponse[] }> {
  const results: EmailResponse[] = [];
  
  try {
    if (type === 'confirmed') {
      // Correo al cliente
      const clientResult = await sendSimpleReservationConfirmedEmail(clientEmail, reservationData);
      results.push(clientResult);
      
      // Correo al conductor si está disponible
      if (driverEmail) {
        const driverResult = await sendSimpleReservationEmail(
          emailTemplates.TRIP_ASSIGNED_DRIVER,
          driverEmail,
          reservationData
        );
        results.push(driverResult);
      }
    }

    const allSuccessful = results.every(result => result.success);
    
    return {
      success: allSuccessful,
      results
    };
  } catch (error) {
    console.error('Error sending simple automatic emails:', error);
    return {
      success: false,
      results: [
        {
          success: false,
          error: 'Failed to send automatic emails'
        }
      ]
    };
  }
}

// Función para enviar múltiples correos automáticamente (versión original)
export async function sendAutomaticEmails(
  reservationId: string,
  clientEmail: string,
  type: 'created' | 'confirmed' | 'completed',
  driverEmail?: string
): Promise<{ success: boolean; results: EmailResponse[] }> {
  const results: EmailResponse[] = [];
  
  try {
    if (type === 'created') {
      // Correo al cliente
      const clientResult = await sendReservationCreatedEmail(reservationId, clientEmail);
      results.push(clientResult);
      
      // Correo al admin
      const adminResult = await sendNewReservationAdminEmail(reservationId);
      results.push(adminResult);
      
    } else if (type === 'confirmed') {
      // Correo al cliente
      const clientResult = await sendReservationConfirmedEmail(reservationId, clientEmail);
      results.push(clientResult);
      
      // Correo al conductor si está disponible
      if (driverEmail) {
        const driverResult = await sendTripAssignedDriverEmail(reservationId, driverEmail);
        results.push(driverResult);
      }
      
    } else if (type === 'completed') {
      // Correo al cliente
      const clientResult = await sendTripCompletedEmail(reservationId, clientEmail);
      results.push(clientResult);
    }

    const allSuccessful = results.every(result => result.success);
    
    return {
      success: allSuccessful,
      results
    };
  } catch (error) {
    console.error('Error sending automatic emails:', error);
    return {
      success: false,
      results: [
        {
          success: false,
          error: 'Failed to send automatic emails'
        }
      ]
    };
  }
}

// Verificar configuración de email
export async function verifyEmailConfiguration(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'GET',
    });

    const data = await response.json();
    
    return {
      connected: data.connected || false,
      message: data.message || data.error || 'Unknown status'
    };
  } catch (error) {
    return {
      connected: false,
      message: 'Failed to verify email configuration'
    };
  }
} 