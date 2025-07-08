import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservation ID' }, { status: 400 });
    }

    console.log('Debug: Fetching reservation with ID:', reservationId);

    // Obtener reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      return NextResponse.json({ 
        error: 'Reservation not found', 
        details: reservationError,
        reservationId 
      }, { status: 404 });
    }

    // Obtener usuario
    let userProfile = null;
    if (reservation.user_id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', reservation.user_id)
        .single();
      userProfile = { data, error };
    }

    // Obtener trip y conductor
    let tripData = null;
    let driverData = null;
    
    if (reservation.trip_id) {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', reservation.trip_id)
        .single();
      
      tripData = { data: trip, error: tripError };

      if (trip && trip.driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', trip.driver_id)
          .single();
        
        driverData = { data: driver, error: driverError };
      }
    }

    return NextResponse.json({
      reservation,
      userProfile,
      tripData,
      driverData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 