import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import emailService from '@/lib/emailService';

// Force this route to be dynamic
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
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
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
