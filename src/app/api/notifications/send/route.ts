import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import notificationService, { NotificationData, NotificationTemplate } from '@/lib/notificationService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    let user = authData?.user;

    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseTokenClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data } = await supabaseTokenClient.auth.getUser(token);
        user = data.user ?? null;
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      recipientEmail, 
      recipientPhone, 
      templateName, 
      notificationData,
      sendEmail
    } = body;

    // Validar campos requeridos
    if (!recipientEmail || !templateName || !notificationData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: recipientEmail, templateName, notificationData' 
        },
        { status: 400 }
      );
    }

    // Enviar notificaciones
    

    const results = await notificationService.sendNotification(
      recipientEmail,
      recipientPhone,
      templateName as NotificationTemplate,
      notificationData as NotificationData,
      { sendEmail }
    );

    // Determinar si hubo éxito general
    const overallSuccess = results.email.success || (results.whatsapp?.success || false);

    return NextResponse.json({
      success: overallSuccess,
      results: {
        email: sendEmail === false ? {
          success: false,
          skipped: true,
          reason: 'Email skipped'
        } : {
          success: results.email.success,
          messageId: results.email.messageId,
          error: results.email.error
        },
        whatsapp: results.whatsapp ? {
          success: results.whatsapp.success,
          messageId: results.whatsapp.messageId,
          error: results.whatsapp.error
        } : {
          success: false,
          skipped: true,
          reason: !recipientPhone ? 'No phone provided' : 'WhatsApp not configured'
        }
      },
      message: overallSuccess 
        ? 'Notificaciones enviadas' 
        : 'Error enviando notificaciones'
    });
  } catch (error) {
    console.error('❌ Notification API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// API para verificar configuración
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    let user = authData?.user;

    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseTokenClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data } = await supabaseTokenClient.auth.getUser(token);
        user = data.user ?? null;
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = notificationService.getConfig();
    
    return NextResponse.json({
      success: true,
      config: {
        emailEnabled: config.emailEnabled,
        whatsappEnabled: config.whatsappEnabled,
        whatsappNumber: config.whatsappNumber || 'Not configured'
      },
      message: 'Notification service status'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get configuration'
    }, { status: 500 });
  }
}
