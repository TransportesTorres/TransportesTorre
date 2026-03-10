import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/supabase/supabase';
import { Trip, ServiceType, Driver, VehicleCategory } from '@/types';

interface TripsState {
  trips: Trip[];
  selectedTrip: Trip | null;
  serviceTypes: ServiceType[];
  drivers: Driver[];
  vehicleCategories: VehicleCategory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TripsState = {
  trips: [],
  selectedTrip: null,
  serviceTypes: [],
  drivers: [],
  vehicleCategories: [],
  isLoading: false,
  error: null,
};

// Async thunks para viajes
export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (options: { all?: boolean } = {}, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          driver:drivers(*),
          service_type:service_types(*),
          reservations(
            *,
            profiles(
              id,
              email,
              full_name,
              phone,
              role
            )
          )
        `)
        .order('departure_time', { ascending: true });

      // Si no se especifica 'all', filtrar solo viajes disponibles
      if (!options?.all) {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Trip[];
    } catch (error) {
      return rejectWithValue('Error al obtener viajes');
    }
  }
);

export const fetchServiceTypes = createAsyncThunk(
  'trips/fetchServiceTypes',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as ServiceType[];
    } catch (error) {
      return rejectWithValue('Error al obtener tipos de servicios');
    }
  }
);

export const fetchDrivers = createAsyncThunk(
  'trips/fetchDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Driver[];
    } catch (error) {
      return rejectWithValue('Error al obtener conductores');
    }
  }
);

export const fetchVehicleCategories = createAsyncThunk(
  'trips/fetchVehicleCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as VehicleCategory[];
    } catch (error) {
      return rejectWithValue('Error al obtener categorías de vehículos');
    }
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData: Partial<Trip>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select(`
          *,
          driver:drivers(*),
          service_type:service_types(*)
        `)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Trip;
    } catch (error) {
      return rejectWithValue('Error al crear viaje');
    }
  }
);

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ id, updates }: { id: string; updates: Partial<Trip> }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          driver:drivers(*),
          service_type:service_types(*)
        `)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Trip;
    } catch (error) {
      return rejectWithValue('Error al actualizar viaje');
    }
  }
);

export const deleteTrip = createAsyncThunk(
  'trips/deleteTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        return rejectWithValue(error.message);
      }

      return tripId;
    } catch (error) {
      return rejectWithValue('Error al eliminar viaje');
    }
  }
);

// Función para actualizar estado de viaje desde reserva
export const updateTripStatusFromReservation = createAsyncThunk(
  'trips/updateTripStatusFromReservation',
  async ({ tripId, newStatus }: { tripId: string; newStatus: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', tripId)
        .select(`
          *,
          driver:drivers(*),
          service_type:service_types(*)
        `)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Trip;
    } catch (error) {
      return rejectWithValue('Error al actualizar estado del viaje');
    }
  }
);

// Función para obtener viajes con información de reservas
export const fetchTripsWithReservations = createAsyncThunk(
  'trips/fetchTripsWithReservations',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:drivers(*),
          service_type:service_types(*),
          reservations(
            id,
            user_id,
            status,
            passenger_count,
            pickup_location,
            dropoff_location,
            contact_phone,
            flight_number,
            special_requirements,
            confirmation_code,
            profiles!inner(
              id,
              full_name,
              email,
              phone
            )
          )
        `)
        .order('departure_time', { ascending: true });

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as (Trip & { reservations: any[] })[];
    } catch (error) {
      return rejectWithValue('Error al obtener viajes con reservas');
    }
  }
);

// Función para obtener el usuario que reservó un viaje
export const getTripReservationUser = createAsyncThunk(
  'trips/getTripReservationUser',
  async (tripId: string, { rejectWithValue }) => {
    try {
      console.log('🔍 Buscando usuario para trip:', tripId);
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          user_id,
          status,
          passenger_count,
          pickup_location,
          dropoff_location,
          contact_phone,
          flight_number,
          special_requirements,
          confirmation_code,
          profiles!inner(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('trip_id', tripId)
        .eq('status', 'confirmed') // Solo reservas confirmadas
        .single();

      console.log('🔍 Query result:', { data, error });

      if (error) {
        console.error('❌ Error en query:', error);
        return rejectWithValue(error.message);
      }

      if (!data) {
        console.error('❌ No se encontró reserva confirmada para el viaje');
        return rejectWithValue('No se encontró reserva confirmada para este viaje');
      }

      const result = {
        reservation: data,
        user: data.profiles
      };

      console.log('✅ Usuario encontrado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error general en getTripReservationUser:', error);
      return rejectWithValue('Error al obtener usuario de la reserva');
    }
  }
);

// Función para cancelar viaje y enviar correos de cancelación
export const cancelTrip = createAsyncThunk(
  'trips/cancelTrip',
  async (tripId: string, { rejectWithValue, dispatch }) => {
    try {
      console.log('🔄 Iniciando cancelTrip para trip:', tripId);
      
      // 1. Obtener información del usuario que reservó
      console.log('📋 Obteniendo información del usuario...');
      const reservationResult = await dispatch(getTripReservationUser(tripId));
      
      console.log('📋 Resultado de getTripReservationUser:', reservationResult);
      
      if (getTripReservationUser.rejected.match(reservationResult)) {
        console.log('⚠️ No se encontró la reserva para este viaje, continuando con cancelación...');
        // Continuar con la cancelación aunque no haya reserva
      }

      let reservationData = null;
      let user = null;

      if (getTripReservationUser.fulfilled.match(reservationResult)) {
        const result = reservationResult.payload as any;
        reservationData = result.reservation;
        user = result.user;
        console.log('👤 Usuario encontrado:', user);
        console.log('📝 Reserva encontrada:', reservationData);
      }

      // 2. Actualizar estados del viaje y reserva
      console.log('🔄 Actualizando estados...');
      const updatePromises = [
        supabase
          .from('trips')
          .update({ status: 'cancelled' })
          .eq('id', tripId)
          .select(`
            *,
            driver:drivers(*),
            service_type:service_types(*)
          `)
          .single()
      ];

      // Si hay reserva, también actualizarla
      if (reservationData) {
        updatePromises.push(
          supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', reservationData.id)
            .single()
        );
      }

      const results = await Promise.all(updatePromises);
      const tripUpdate = results[0];
      const reservationUpdate = results[1];

      if (tripUpdate.error) {
        console.error('❌ Error actualizando viaje:', tripUpdate.error);
        return rejectWithValue(tripUpdate.error.message);
      }

      if (reservationUpdate && reservationUpdate.error) {
        console.error('❌ Error actualizando reserva:', reservationUpdate.error);
        return rejectWithValue(reservationUpdate.error.message);
      }

      console.log('✅ Estados actualizados correctamente');

      // 3. Enviar correos de cancelación (solo si hay usuario y reserva)
      if (user && reservationData) {
        console.log('📧 Preparando correos de cancelación...');
        try {
          const emailData = {
            client_name: user.full_name,
            confirmation_code: reservationData.confirmation_code,
            pickup_location: reservationData.pickup_location,
            dropoff_location: reservationData.dropoff_location,
            passenger_count: reservationData.passenger_count,
            contact_phone: reservationData.contact_phone,
            flight_number: reservationData.flight_number,
            special_requirements: reservationData.special_requirements,
            driver_name: tripUpdate.data.driver?.full_name,
            vehicle_info: tripUpdate.data.driver?.vehicle_info 
              ? `${tripUpdate.data.driver.vehicle_info.brand} ${tripUpdate.data.driver.vehicle_info.model}`
              : undefined,
            reservation_status: 'Cancelado por administración',
            pickup_time: reservationData.pickup_time,
            service_date: reservationData.service_date
          };

          console.log('📧 Datos del correo:', emailData);

          // Enviar correos en paralelo
          const emailPromises = [];

          // Correo al cliente
          console.log('📧 Enviando correo de cancelación al cliente:', user.email);
          emailPromises.push(
            fetch('/api/email/send-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                templateName: 'trip_cancelled',
                recipientEmail: user.email,
                reservationData: emailData
              }),
            })
          );

          // Correo al conductor (si existe)
          if (tripUpdate.data.driver?.email) {
            console.log('📧 Enviando correo de cancelación al conductor:', tripUpdate.data.driver.email);
            emailPromises.push(
              fetch('/api/email/send-simple', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  templateName: 'trip_cancelled',
                  recipientEmail: tripUpdate.data.driver.email,
                  reservationData: emailData
                }),
              })
            );
          }

          const emailResponses = await Promise.all(emailPromises);
          const emailResults = await Promise.all(emailResponses.map(response => response.json()));

          console.log('📧 Resultados de correos de cancelación:', emailResults);

          const clientEmailResult = emailResults[0];
          const driverEmailResult = emailResults[1];

          if (clientEmailResult?.success) {
            console.log('✅ Correo de cancelación enviado exitosamente al cliente');
          } else {
            console.error('❌ Error enviando correo al cliente:', clientEmailResult?.error);
          }

          if (driverEmailResult?.success) {
            console.log('✅ Correo de cancelación enviado exitosamente al conductor');
          } else if (tripUpdate.data.driver?.email) {
            console.error('❌ Error enviando correo al conductor:', driverEmailResult?.error);
          }

        } catch (emailError) {
          console.error('❌ Error en el proceso de correos de cancelación:', emailError);
          // No fallar todo el proceso por un error de correo
        }
      } else {
        console.log('ℹ️ No hay reserva asociada, no se envían correos de cancelación');
      }

      console.log('✅ cancelTrip finalizado exitosamente');
      return tripUpdate.data as Trip;
    } catch (error) {
      console.error('❌ Error general en cancelTrip:', error);
      return rejectWithValue('Error al cancelar viaje');
    }
  }
);

// Función para completar viaje y enviar correo de finalización
export const completeTrip = createAsyncThunk(
  'trips/completeTrip',
  async (tripId: string, { rejectWithValue, dispatch }) => {
    try {
      console.log('🔄 Iniciando completeTrip para trip:', tripId);
      
      // 1. Obtener información del usuario que reservó
      console.log('📋 Obteniendo información del usuario...');
      const reservationResult = await dispatch(getTripReservationUser(tripId));
      
      console.log('📋 Resultado de getTripReservationUser:', reservationResult);
      
      if (getTripReservationUser.rejected.match(reservationResult)) {
        console.error('❌ No se encontró la reserva para este viaje');
        return rejectWithValue('No se encontró la reserva para este viaje');
      }

      const { reservation, user } = reservationResult.payload as any;
      console.log('👤 Usuario encontrado:', user);
      console.log('📝 Reserva encontrada:', reservation);

      // 2. Actualizar estados del viaje y reserva
      console.log('🔄 Actualizando estados...');
      const [tripUpdate, reservationUpdate] = await Promise.all([
        supabase
          .from('trips')
          .update({ status: 'completed' })
          .eq('id', tripId)
          .select(`
            *,
            driver:drivers(*),
            service_type:service_types(*)
          `)
          .single(),
        
        supabase
          .from('reservations')
          .update({ status: 'completed' })
          .eq('id', reservation.id)
          .single()
      ]);

      if (tripUpdate.error) {
        console.error('❌ Error actualizando viaje:', tripUpdate.error);
        return rejectWithValue(tripUpdate.error.message);
      }

      if (reservationUpdate.error) {
        console.error('❌ Error actualizando reserva:', reservationUpdate.error);
        return rejectWithValue(reservationUpdate.error.message);
      }

      console.log('✅ Estados actualizados correctamente');

      // 3. Preparar datos de notificación y enviar correo de finalización
      console.log('📧 Preparando correo de finalización...');
      try {
        const ratingUrl = `${window.location.origin}/rating/${reservation.id}`;

        const reservationData = {
          client_name: user.full_name,
          confirmation_code: reservation.confirmation_code,
          pickup_location: reservation.pickup_location,
          dropoff_location: reservation.dropoff_location,
          passenger_count: reservation.passenger_count,
          contact_phone: reservation.contact_phone,
          flight_number: reservation.flight_number,
          special_requirements: reservation.special_requirements,
          driver_name: tripUpdate.data.driver?.full_name,
          vehicle_info: tripUpdate.data.driver?.vehicle_info 
            ? `${tripUpdate.data.driver.vehicle_info.brand} ${tripUpdate.data.driver.vehicle_info.model}`
            : undefined,
          pickup_time: reservation.pickup_time,
          service_date: reservation.service_date,
          rating_url: ratingUrl
        };

        console.log('📧 Datos del correo:', reservationData);
        console.log('📧 Enviando correo a:', user.email);

        const emailResponse = await fetch('/api/email/send-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateName: 'trip_completed',
            recipientEmail: user.email,
            reservationData
          }),
        });

        const emailResult = await emailResponse.json();
        console.log('📧 Resultado del correo:', emailResult);

        if (emailResult.success) {
          console.log('✅ Correo de finalización enviado exitosamente a:', user.email);
        } else {
          console.error('❌ Error enviando correo:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error en el proceso de correo:', emailError);
        // No fallar todo el proceso por un error de correo
      }

      // 4. Enviar WhatsApp de finalización (sin duplicar email)
      try {
        const recipientPhone = reservation.contact_phone || user.phone;
        if (recipientPhone) {
          const whatsappResponse = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientEmail: user.email,
              recipientPhone,
              templateName: 'trip_completed',
              notificationData: {
                client_name: user.full_name,
                confirmation_code: reservation.confirmation_code,
                pickup_location: reservation.pickup_location,
                dropoff_location: reservation.dropoff_location,
                passenger_count: reservation.passenger_count,
                contact_phone: reservation.contact_phone,
                flight_number: reservation.flight_number,
                special_requirements: reservation.special_requirements,
                driver_name: tripUpdate.data.driver?.full_name,
                vehicle_info: tripUpdate.data.driver?.vehicle_info 
                  ? `${tripUpdate.data.driver.vehicle_info.brand} ${tripUpdate.data.driver.vehicle_info.model}`
                  : undefined,
                pickup_time: reservation.pickup_time,
                service_date: reservation.service_date,
                rating_url: `${window.location.origin}/rating/${reservation.id}`
              },
              sendEmail: false
            })
          });

          const whatsappResult = await whatsappResponse.json();
          if (whatsappResult.success) {
            console.log('✅ WhatsApp de finalización enviado a:', recipientPhone);
          } else {
            console.error('❌ Error enviando WhatsApp de finalización:', whatsappResult.error || whatsappResult);
          }
        } else {
          console.log('⚠️ No hay teléfono del cliente, se omite WhatsApp de finalización');
        }
      } catch (whatsappError) {
        console.error('❌ Error en el proceso de WhatsApp:', whatsappError);
      }

      console.log('✅ completeTrip finalizado exitosamente');
      return tripUpdate.data as Trip;
    } catch (error) {
      console.error('❌ Error general en completeTrip:', error);
      return rejectWithValue('Error al completar viaje');
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTrip: (state, action: PayloadAction<Trip | null>) => {
      state.selectedTrip = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch trips
      .addCase(fetchTrips.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips = action.payload;
        state.error = null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch service types
      .addCase(fetchServiceTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceTypes = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch drivers
      .addCase(fetchDrivers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drivers = action.payload;
        state.error = null;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch vehicle categories
      .addCase(fetchVehicleCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicleCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicleCategories = action.payload;
        state.error = null;
      })
      .addCase(fetchVehicleCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create trip
      .addCase(createTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips.push(action.payload);
        state.error = null;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update trip
      .addCase(updateTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTrip.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete trip
      .addCase(deleteTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips = state.trips.filter(trip => trip.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update trip status from reservation
      .addCase(updateTripStatusFromReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTripStatusFromReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTripStatusFromReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch trips with reservations
      .addCase(fetchTripsWithReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTripsWithReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips = action.payload;
        state.error = null;
      })
      .addCase(fetchTripsWithReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Complete trip
      .addCase(completeTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(completeTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Cancel trip
      .addCase(cancelTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelTrip.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedTrip } = tripsSlice.actions;
export default tripsSlice.reducer; 
