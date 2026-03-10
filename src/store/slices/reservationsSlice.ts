import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/supabase/supabase';
import { Reservation } from '@/types';
import { 
  sendReservationCreatedNotification,
  sendNewReservationAdminNotification,
  sendReservationConfirmedNotification,
  sendDriverAssignedNotification,
  sendTripAssignedDriverNotification,
  sendTripCompletedNotification
} from '@/lib/notificationHelpers';

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
  async (params: { userId?: string } = {}, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          trips(
            *,
            driver:drivers(*)
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

      if (params.userId) {
        query = query.eq('user_id', params.userId);
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
      // Crear la reserva directamente con todos los campos
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select(`
          *,
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

      // Si hay trip_id, actualizar el estado del viaje a 'booked'
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
        trip: reservation.trips || null,
        user: reservation.profiles
      };

      // Enviar notificaciones (Email + WhatsApp) al cliente y admin
      try {
        
        
        const notificationData = {
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

        // 1. Notificar al cliente (Email + WhatsApp)
        const clientEmail = reservation.profiles?.email || reservation.requester_email;
        const clientPhone = reservation.contact_phone || reservation.profiles?.phone;
        
        
        
        if (clientEmail) {
          const clientResult = await sendReservationCreatedNotification(
            clientEmail,
            clientPhone,
            notificationData
          );
          
          if (clientResult.success) {
          } else {
            console.error('❌ Error en notificaciones al cliente:', clientResult.error);
          }
        }

        // 2. Notificar al admin (Email + WhatsApp)
        const adminResponse = await fetch('/api/notifications/send-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateName: 'new_reservation_admin',
            notificationData
          })
        });

        if (!adminResponse.ok) {
          const adminResult = await adminResponse.json().catch(() => ({}));
          console.error('❌ Error en notificaciones al admin:', adminResult);
        }

      } catch (notificationError) {
        console.error('❌ Error enviando notificaciones:', notificationError);
        // No fallar la creación de la reserva por un error de notificación
      }

      return mappedData as Reservation;
    } catch (error) {
      console.error('Error in createReservation:', error);
      return rejectWithValue('Error al crear reservación');
    }
  }
);

// Nueva función: Solo confirmar reserva (sin asignar conductor)
export const confirmReservation = createAsyncThunk(
  'reservations/confirmReservation',
  async ({ reservationId }: { reservationId: string }, { rejectWithValue }) => {
    try {
      

      // Obtener información de la reserva
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .eq('id', reservationId)
        .single();

      if (fetchError) {
        throw new Error('Error al obtener información de la reserva: ' + fetchError.message);
      }

      // Actualizar el estado de la reserva a "assign_driver"
      const { data: updated, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'assign_driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .single();

      if (updateError) {
        throw new Error('Error al actualizar la reserva: ' + updateError.message);
      }

      // Enviar notificaciones de confirmación (Email + WhatsApp) al cliente
      try {
        

        const notificationData = {
          client_name: reservation.profiles?.full_name || reservation.requester_name || 'Cliente',
          confirmation_code: reservation.confirmation_code,
          pickup_location: reservation.pickup_location,
          dropoff_location: reservation.dropoff_location,
          passenger_count: reservation.passenger_count,
          contact_phone: reservation.contact_phone || reservation.profiles?.phone || 'No especificado',
          flight_number: reservation.flight_number,
          special_requirements: reservation.special_requirements,
          pickup_time: reservation.pickup_time,
          service_date: reservation.service_date
        };

        const clientEmail = reservation.profiles?.email || reservation.requester_email;
        const clientPhone = reservation.contact_phone || reservation.profiles?.phone;

        if (clientEmail) {
          const result = await sendReservationConfirmedNotification(
            clientEmail,
            clientPhone,
            notificationData
          );
          
          if (!result.success) {
            console.error('❌ Error en notificaciones de confirmación:', result.error);
          }
        }

      } catch (notificationError) {
        console.error('❌ Error enviando notificaciones de confirmación:', notificationError);
      }

      return updated;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Nueva función: Asignar conductor (segundo paso)
export const assignDriverToReservation = createAsyncThunk(
  'reservations/assignDriverToReservation',
  async ({ reservationId, driverId }: { reservationId: string; driverId: string }, { rejectWithValue }) => {
    try {
      

      // Obtener información de la reserva
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .eq('id', reservationId)
        .single();

      if (fetchError) {
        throw new Error('Error al obtener información de la reserva: ' + fetchError.message);
      }

      // Obtener información del conductor
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driverError) {
        throw new Error('Error al obtener información del conductor: ' + driverError.message);
      }

      // Crear el viaje
      const tripData = {
        origin: reservation.trip_request_origin,
        destination: reservation.trip_request_destination,
        departure_time: reservation.trip_request_departure_time,
        estimated_duration: reservation.trip_request_estimated_duration || 60,
        service_type_id: reservation.trip_request_service_type_id,
        max_passengers: reservation.passenger_count,
        driver_id: driverId,
        vehicle_category: reservation.trip_request_vehicle_category || 'sedan_ejecutivo',
        status: 'booked',
        special_instructions: reservation.special_requirements || reservation.additional_services,
        includes_tolls: reservation.trip_request_includes_tolls ?? true,
        includes_parking: reservation.trip_request_includes_parking ?? true,
        gps_tracking: reservation.trip_request_gps_tracking ?? true,
      };

      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single();

      if (tripError) {
        throw new Error('Error al crear el viaje: ' + tripError.message);
      }

      // Actualizar la reserva con el trip_id y estado final
      const { data: updated, error: updateError } = await supabase
        .from('reservations')
        .update({
          trip_id: newTrip.id,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .single();

      if (updateError) {
        throw new Error('Error al actualizar la reserva: ' + updateError.message);
      }

      // Enviar notificaciones (Email + WhatsApp) al cliente Y al conductor
      try {
        

        const notificationData = {
          client_name: reservation.profiles?.full_name || reservation.requester_name || 'Cliente',
          confirmation_code: reservation.confirmation_code,
          pickup_location: reservation.pickup_location,
          dropoff_location: reservation.dropoff_location,
          passenger_count: reservation.passenger_count,
          contact_phone: reservation.contact_phone || reservation.profiles?.phone || 'No especificado',
          flight_number: reservation.flight_number,
          special_requirements: reservation.special_requirements,
          driver_name: driver.full_name,
          driver_phone: driver.phone,
          vehicle_info: driver.vehicle_info ? 
            `${driver.vehicle_info.brand} ${driver.vehicle_info.model} ${driver.vehicle_info.year} - ${driver.vehicle_info.plate}` 
            : 'Información no disponible',
          pickup_time: reservation.pickup_time,
          service_date: reservation.service_date
        };

        // 1. Notificar al cliente (conductor asignado)
        const clientEmail = reservation.profiles?.email || reservation.requester_email;
        const clientPhone = reservation.contact_phone || reservation.profiles?.phone;
        
        if (clientEmail) {
          const clientResult = await sendDriverAssignedNotification(
            clientEmail,
            clientPhone,
            notificationData
          );
          
          if (!clientResult.success) {
            console.error('❌ Error en notificaciones al cliente:', clientResult.error);
          }
        }

        // 2. Notificar al conductor (viaje asignado)
        if (driver.email) {
          const driverResult = await sendTripAssignedDriverNotification(
            driver.email,
            driver.phone,
            notificationData
          );
          
          if (!driverResult.success) {
            console.error('❌ Error en notificaciones al conductor:', driverResult.error);
          }
        }

      } catch (notificationError) {
        console.error('❌ Error enviando notificaciones:', notificationError);
      }

      return updated;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
          trips(
            *,
            driver:drivers(*)
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

// Actualizar estado de reserva (para admins) - MANTENER PARA RECHAZOS
export const updateReservationStatus = createAsyncThunk(
  'reservations/updateReservationStatus',
  async ({ reservationId, status, driverId }: { reservationId: string; status: string; driverId: string | null }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener la reserva actual con información del cliente
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .eq('id', reservationId)
        .single();

      if (fetchError) {
        throw new Error('Error al obtener la reserva: ' + fetchError.message);
      }

      let updatedReservation;
      let assignedDriver = null;

      if (status === 'confirmed' && driverId) {
        // Obtener información del conductor asignado
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', driverId)
          .single();

        if (driverError) {
          throw new Error('Error al obtener información del conductor: ' + driverError.message);
        }

        assignedDriver = driver;

        // Crear el viaje cuando se aprueba la solicitud
        const tripData = {
          origin: reservation.trip_request_origin,
          destination: reservation.trip_request_destination,
          departure_time: reservation.trip_request_departure_time,
          estimated_duration: reservation.trip_request_estimated_duration || 60,
          service_type_id: reservation.trip_request_service_type_id,
          max_passengers: reservation.passenger_count,
          driver_id: driverId,
          vehicle_category: reservation.trip_request_vehicle_category || 'sedan_ejecutivo',
          status: 'booked',
          special_instructions: reservation.special_requirements || reservation.additional_services,
          includes_tolls: reservation.trip_request_includes_tolls ?? true,
          includes_parking: reservation.trip_request_includes_parking ?? true,
          gps_tracking: reservation.trip_request_gps_tracking ?? true,
        };

        const { data: newTrip, error: tripError } = await supabase
          .from('trips')
          .insert([tripData])
          .select()
          .single();

        if (tripError) {
          throw new Error('Error al crear el viaje: ' + tripError.message);
        }

        // Actualizar la reserva con el trip_id y estado
        const { data: updated, error: updateError } = await supabase
          .from('reservations')
          .update({
            trip_id: newTrip.id,
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId)
          .select(`
            *,
            profiles!inner(
              id,
              email,
              full_name,
              phone,
              role
            )
          `)
          .single();

        if (updateError) {
          throw new Error('Error al actualizar la reserva: ' + updateError.message);
        }

        updatedReservation = updated;

        // Enviar emails de confirmación
        try {
          

          // Preparar datos para los emails
          const clientEmailData = {
            client_name: reservation.profiles?.full_name || reservation.requester_name || 'Cliente',
            client_email: reservation.profiles?.email || reservation.requester_email,
            confirmation_code: reservation.confirmation_code,
            pickup_location: reservation.trip_request_origin,
            dropoff_location: reservation.trip_request_destination,
            passenger_count: reservation.passenger_count,
            contact_phone: reservation.contact_phone || reservation.profiles?.phone || 'No especificado',
            flight_number: reservation.flight_number,
            special_requirements: reservation.special_requirements,
            driver_name: assignedDriver.full_name,
            driver_phone: assignedDriver.phone,
            vehicle_info: assignedDriver.vehicle_info ? 
              `${assignedDriver.vehicle_info.brand} ${assignedDriver.vehicle_info.model} ${assignedDriver.vehicle_info.year} - ${assignedDriver.vehicle_info.plate}` 
              : 'Información no disponible',
            reservation_status: 'confirmed',
            pickup_time: reservation.pickup_time,
            service_date: reservation.service_date
          };

          // Email al cliente
          if (reservation.profiles?.email || reservation.requester_email) {
            const clientEmail = reservation.profiles?.email || reservation.requester_email;
            await fetch('/api/email/send-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                templateName: 'reservation_confirmed',
                recipientEmail: clientEmail,
                reservationData: clientEmailData
              }),
            });
            
          }

          // Email al conductor
          if (assignedDriver.email) {
            await fetch('/api/email/send-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                templateName: 'trip_assigned_driver',
                recipientEmail: assignedDriver.email,
                reservationData: clientEmailData
              }),
            });
            
          }

          

        } catch (emailError) {
          console.error('❌ Error enviando emails:', emailError);
          // No fallar la operación por errores de email
        }

      } else {
        // Solo actualizar el estado de la reserva
        const { data: updated, error: updateError } = await supabase
          .from('reservations')
          .update({
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId)
          .select(`
            *,
            profiles!inner(
              id,
              email,
              full_name,
              phone,
              role
            )
          `)
          .single();

        if (updateError) {
          throw new Error('Error al actualizar la reserva: ' + updateError.message);
        }

        updatedReservation = updated;

        // Enviar email de rechazo si es necesario
        if (status === 'rejected') {
          try {
            

            const rejectEmailData = {
              client_name: reservation.profiles?.full_name || reservation.requester_name || 'Cliente',
              client_email: reservation.profiles?.email || reservation.requester_email,
              confirmation_code: reservation.confirmation_code,
              pickup_location: reservation.trip_request_origin,
              dropoff_location: reservation.trip_request_destination,
              passenger_count: reservation.passenger_count,
              contact_phone: reservation.contact_phone || reservation.profiles?.phone || 'No especificado',
              flight_number: reservation.flight_number,
              reservation_status: 'rejected',
              pickup_time: reservation.pickup_time,
              service_date: reservation.service_date
            };

            if (reservation.profiles?.email || reservation.requester_email) {
              const clientEmail = reservation.profiles?.email || reservation.requester_email;
              await fetch('/api/email/send-simple', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  templateName: 'trip_cancelled',
                  recipientEmail: clientEmail,
                  reservationData: rejectEmailData
                }),
              });
              
            }

          } catch (emailError) {
            console.error('❌ Error enviando email de rechazo:', emailError);
          }
        }
      }

      return updatedReservation;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
      })
      // Update reservation status
      .addCase(updateReservationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReservationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reservations.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
      })
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Confirm reservation
      .addCase(confirmReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reservations.findIndex(res => res.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(confirmReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Assign driver to reservation
      .addCase(assignDriverToReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignDriverToReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reservations.findIndex(res => res.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(assignDriverToReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedReservation } = reservationsSlice.actions;
export default reservationsSlice.reducer; 
