// Helper functions para integrar notificaciones (Email + WhatsApp) con Redux

import { NotificationData, NotificationTemplate } from './notificationService';

export interface NotificationRequest {
  recipientEmail: string;
  recipientPhone?: string;
  templateName: NotificationTemplate;
  notificationData: NotificationData;
}

export interface NotificationResponse {
  success: boolean;
  results?: {
    email: {
      success: boolean;
      messageId?: string;
      error?: string;
    };
    whatsapp: {
      success: boolean;
      messageId?: string;
      error?: string;
      skipped?: boolean;
      reason?: string;
    };
  };
  message?: string;
  error?: string;
}

// Enviar notificación (Email + WhatsApp)
export async function sendNotification(
  recipientEmail: string,
  recipientPhone: string | undefined,
  templateName: NotificationTemplate,
  notificationData: NotificationData
): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientEmail,
        recipientPhone,
        templateName,
        notificationData,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send notification'
      };
    }

    return {
      success: true,
      results: data.results,
      message: data.message || 'Notifications sent successfully'
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: 'Network error while sending notification'
    };
  }
}

// Funciones específicas para cada tipo de notificación

export async function sendReservationCreatedNotification(
  clientEmail: string,
  clientPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    clientEmail,
    clientPhone,
    'reservation_created',
    data
  );
}

export async function sendReservationConfirmedNotification(
  clientEmail: string,
  clientPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    clientEmail,
    clientPhone,
    'reservation_confirmed',
    data
  );
}

export async function sendNewReservationAdminNotification(
  adminEmail: string,
  adminPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    adminEmail,
    adminPhone,
    'new_reservation_admin',
    data
  );
}

export async function sendTripAssignedDriverNotification(
  driverEmail: string,
  driverPhone: string,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    driverEmail,
    driverPhone,
    'trip_assigned_driver',
    data
  );
}

export async function sendDriverAssignedNotification(
  clientEmail: string,
  clientPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    clientEmail,
    clientPhone,
    'driver_assigned',
    data
  );
}

export async function sendTripCompletedNotification(
  clientEmail: string,
  clientPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    clientEmail,
    clientPhone,
    'trip_completed',
    data
  );
}

export async function sendTripCancelledNotification(
  clientEmail: string,
  clientPhone: string | undefined,
  data: NotificationData
): Promise<NotificationResponse> {
  return sendNotification(
    clientEmail,
    clientPhone,
    'trip_cancelled',
    data
  );
}

// Verificar configuración de notificaciones
export async function verifyNotificationConfiguration(): Promise<{
  success: boolean;
  config?: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappNumber: string;
  };
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'GET',
    });

    const data = await response.json();
    
    return {
      success: data.success || false,
      config: data.config,
      message: data.message || 'Configuration retrieved'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify notification configuration'
    };
  }
}
