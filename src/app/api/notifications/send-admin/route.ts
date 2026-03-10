import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import notificationService, { NotificationData, NotificationTemplate } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { templateName, notificationData } = body as {
      templateName?: NotificationTemplate;
      notificationData?: NotificationData;
    };

    if (!templateName || !notificationData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: templateName, notificationData' },
        { status: 400 }
      );
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const adminPhones = (process.env.ADMIN_PHONES || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No admin emails configured' },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      adminEmails.map((adminEmail, index) =>
        notificationService.sendNotification(
          adminEmail,
          adminPhones[index],
          templateName,
          notificationData
        )
      )
    );

    const overallSuccess = results.every((result) => result.email.success || result.whatsapp?.success);

    return NextResponse.json({
      success: overallSuccess,
      results,
      message: overallSuccess ? 'Admin notifications sent' : 'Admin notifications failed'
    });
  } catch (error) {
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
