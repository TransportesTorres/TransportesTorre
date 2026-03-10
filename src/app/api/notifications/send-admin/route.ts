import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import notificationService, { NotificationData, NotificationTemplate } from '@/lib/notificationService';

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
    const { templateName, notificationData, reservationId } = body as {
      templateName?: NotificationTemplate;
      notificationData?: NotificationData;
      reservationId?: string;
    };

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: templateName' },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = !profileError && profile?.role === 'admin';

    let finalNotificationData = notificationData;

    if (!isAdmin) {
      if (!reservationId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (!serviceRoleKey) {
        return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: reservation, error: reservationError } = await adminClient
        .from('reservations')
        .select(
          `
          *,
          profiles(
            id,
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', reservationId)
        .single();

      if (reservationError || !reservation) {
        return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
      }

      if (reservation.user_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      finalNotificationData = {
        client_name: reservation.profiles?.full_name || reservation.requester_name || 'Cliente',
        confirmation_code: reservation.confirmation_code,
        pickup_location: reservation.pickup_location,
        dropoff_location: reservation.dropoff_location,
        passenger_count: reservation.passenger_count,
        contact_phone: reservation.contact_phone || reservation.profiles?.phone || '',
        flight_number: reservation.flight_number,
        special_requirements: reservation.special_requirements,
        pickup_time: reservation.pickup_time,
        service_date: reservation.service_date
      };
    }

    if (!finalNotificationData) {
      return NextResponse.json(
        { success: false, error: 'Missing notification data' },
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
          finalNotificationData
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
