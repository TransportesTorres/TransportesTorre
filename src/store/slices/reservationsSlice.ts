import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/supabase/supabase';
import { Reservation } from '@/types';

interface ReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReservationsState = {
  reservations: [],
  selectedReservation: null,
  isLoading: false,
  error: null,
};

// Async thunks para reservaciones
export const fetchReservations = createAsyncThunk(
  'reservations/fetchReservations',
  async (userId: string | undefined, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          trips!inner(
            *,
            driver:drivers!inner(*)
          ),
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reservations:', error);
        return rejectWithValue(error.message);
      }

      // Mapear los datos para que coincidan con la estructura esperada
      const mappedData = data?.map(reservation => ({
        ...reservation,
        trip: reservation.trips,
        user: reservation.profiles
      })) || [];

      return mappedData as Reservation[];
    } catch (error) {
      console.error('Error in fetchReservations:', error);
      return rejectWithValue('Error al obtener reservaciones');
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservations/createReservation',
  async (reservationData: Partial<Reservation>, { rejectWithValue }) => {
    try {
      // Iniciar transacción con Supabase
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select(`
          *,
          trips!inner(
            *,
            driver:drivers!inner(*)
          ),
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .single();

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        return rejectWithValue(reservationError.message);
      }

      // Actualizar el estado del viaje a 'booked'
      if (reservation && reservation.trip_id) {
        const { error: tripUpdateError } = await supabase
          .from('trips')
          .update({ status: 'booked' })
          .eq('id', reservation.trip_id);

        if (tripUpdateError) {
          console.error('Error updating trip status:', tripUpdateError);
          // Nota: La reserva ya se creó, pero el viaje no se actualizó
          // En un sistema real, esto debería ser una transacción atómica
        }
      }

      // Mapear los datos para que coincidan con la estructura esperada
      const mappedData = {
        ...reservation,
        trip: reservation.trips,
        user: reservation.profiles
      };

      // Enviar correo de notificación al admin
      try {
        console.log('📧 Enviando notificación al admin sobre nueva reserva...');
        
        const adminNotificationData = {
          client_name: reservation.profiles?.full_name || 'Cliente',
          client_email: reservation.profiles?.email || 'Sin email',
          confirmation_code: reservation.confirmation_code,
          pickup_location: reservation.pickup_location,
          dropoff_location: reservation.dropoff_location,
          passenger_count: reservation.passenger_count,
          total_price: reservation.total_price,
          contact_phone: reservation.contact_phone,
          flight_number: reservation.flight_number,
          special_requirements: reservation.special_requirements,
          trip_origin: reservation.trips?.origin,
          trip_destination: reservation.trips?.destination,
          departure_time: reservation.trips?.departure_time,
          driver_name: reservation.trips?.driver?.full_name,
          vehicle_info: reservation.trips?.driver?.vehicle_info 
            ? `${reservation.trips.driver.vehicle_info.brand} ${reservation.trips.driver.vehicle_info.model}`
            : undefined,
          reservation_status: 'pending'
        };

        // Enviar correo al admin (puedes configurar el email del admin aquí)
        const adminEmail = 'admin@transportestorres.com'; // Cambiar por el email real del admin
        
        await fetch('/api/email/send-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateName: 'new_reservation_admin',
            recipientEmail: adminEmail,
            reservationData: adminNotificationData
          }),
        });

        console.log('✅ Notificación enviada al admin:', adminEmail);
      } catch (emailError) {
        console.error('❌ Error enviando notificación al admin:', emailError);
        // No fallar la creación de la reserva por un error de correo
      }

      return mappedData as Reservation;
    } catch (error) {
      console.error('Error in createReservation:', error);
      return rejectWithValue('Error al crear reservación');
    }
  }
);

export const updateReservation = createAsyncThunk(
  'reservations/updateReservation',
  async ({ id, updates }: { id: string; updates: Partial<Reservation> }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          trips!inner(
            *,
            driver:drivers!inner(*)
          ),
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .single();

      if (error) {
        console.error('Error updating reservation:', error);
        return rejectWithValue(error.message);
      }

      // Sincronizar estado del viaje basado en el estado de la reserva
      if (data && data.trip_id && updates.status) {
        let newTripStatus: string | null = null;
        
        switch (updates.status) {
          case 'confirmed':
            // Reserva confirmada → Viaje sigue siendo 'booked'
            newTripStatus = 'booked';
            break;
          case 'completed':
            // Reserva completada → Viaje completado
            newTripStatus = 'completed';
            break;
          case 'cancelled':
            // Reserva cancelada → Viaje vuelve a estar disponible
            newTripStatus = 'available';
            break;
        }

        if (newTripStatus) {
          const { error: tripUpdateError } = await supabase
            .from('trips')
            .update({ status: newTripStatus })
            .eq('id', data.trip_id);

          if (tripUpdateError) {
            console.error('Error updating trip status:', tripUpdateError);
            // Nota: La reserva se actualizó pero el viaje no
          }
        }
      }

      // Mapear los datos para que coincidan con la estructura esperada
      const mappedData = {
        ...data,
        trip: data.trips,
        user: data.profiles
      };

      return mappedData as Reservation;
    } catch (error) {
      console.error('Error in updateReservation:', error);
      return rejectWithValue('Error al actualizar reservación');
    }
  }
);

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedReservation: (state, action: PayloadAction<Reservation | null>) => {
      state.selectedReservation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reservations
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
        state.error = null;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create reservation
      .addCase(createReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations.unshift(action.payload);
        state.error = null;
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update reservation
      .addCase(updateReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reservations.findIndex(res => res.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedReservation } = reservationsSlice.actions;
export default reservationsSlice.reducer; 