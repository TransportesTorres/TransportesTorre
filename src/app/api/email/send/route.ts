import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
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