import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import emailService from '@/lib/emailService';

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { reservationId, templateName, recipientEmail } = await request.json();

    if (!reservationId || !templateName || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: reservationId, templateName, recipientEmail' },
        { status: 400 }
      );
    }

    const result = await emailService.sendReservationEmail(
      reservationId,
      templateName,
      recipientEmail
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// API para verificar configuración de email
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
      return NextResponse.json({ connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ connected: false, error: 'Forbidden' }, { status: 403 });
    }

    const isConnected = await emailService.verifyConnection();
    
    return NextResponse.json({
      connected: isConnected,
      message: isConnected ? 'SMTP connection verified' : 'SMTP connection failed'
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: 'Failed to verify SMTP connection'
    }, { status: 500 });
  }
} 
