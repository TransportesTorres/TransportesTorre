import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/supabase/supabase';

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_type: string;
  experience_years: number;
  vehicle_info: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color?: string;
    has_gps?: boolean;
    category?: string;
    kilometers?: number;
    max_passengers?: number;
    insurance_per_seat?: boolean;
  } | string;
  certifications?: {
    road_safety: boolean;
    customer_service: boolean;
    last_training_date?: string;
    transport_regulations?: boolean;
  } | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DriversState {
  drivers: Driver[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DriversState = {
  drivers: [],
  isLoading: false,
  error: null,
};

// Función para verificar si el usuario actual es admin
export const verifyAdminStatus = createAsyncThunk(
  'drivers/verifyAdmin',
  async (_, { rejectWithValue }) => {
    try {
      console.log('👤 Verificando estado de admin...');
      
      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔑 Usuario actual:', user);
      
      if (userError || !user) {
        return rejectWithValue('No hay usuario autenticado');
      }
      
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', user.id)
        .single();
      
      console.log('👤 Perfil del usuario:', { data: profile, error: profileError });
      
      return {
        user: user,
        profile: profile,
        isAdmin: profile?.role === 'admin'
      };
    } catch (error) {
      console.error('💥 Error verificando admin:', error);
      return rejectWithValue('Error al verificar estado de admin');
    }
  }
);

// Async thunk para obtener conductores
export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (params: { includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('drivers')
        .select('*')
        .order('full_name', { ascending: true });

      // Si no se especifica incluir inactivos, filtrar solo activos
      if (!params.includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching drivers:', error);
        return rejectWithValue(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
      return rejectWithValue('Error al obtener conductores');
    }
  }
);

// Async thunk para crear conductor
export const createDriver = createAsyncThunk(
  'drivers/createDriver',
  async (driverData: Partial<Driver>, { rejectWithValue }) => {
    try {
      // Convertir objetos a JSON strings para almacenar en la base de datos
      const dataToInsert = {
        ...driverData,
        vehicle_info: typeof driverData.vehicle_info === 'object' 
          ? JSON.stringify(driverData.vehicle_info) 
          : driverData.vehicle_info,
        certifications: driverData.certifications 
          ? (typeof driverData.certifications === 'object' 
             ? JSON.stringify(driverData.certifications) 
             : driverData.certifications)
          : JSON.stringify({
              road_safety: true,
              customer_service: true,
              transport_regulations: true,
              last_training_date: new Date().toISOString().split('T')[0]
            })
      };

      const { data, error } = await supabase
        .from('drivers')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating driver:', error);
        return rejectWithValue(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in createDriver:', error);
      return rejectWithValue('Error al crear conductor');
    }
  }
);

// Async thunk para actualizar conductor
export const updateDriver = createAsyncThunk(
  'drivers/updateDriver',
  async ({ id, data }: { id: string; data: Partial<Driver> }, { rejectWithValue }) => {
    try {
      console.log('🔄 Iniciando actualización de conductor:', { id, data });
      
      // Convertir objetos a JSON strings para almacenar en la base de datos
      const dataToUpdate = {
        ...data,
        vehicle_info: data.vehicle_info && typeof data.vehicle_info === 'object' 
          ? JSON.stringify(data.vehicle_info) 
          : data.vehicle_info,
        certifications: data.certifications 
          ? (typeof data.certifications === 'object' 
             ? JSON.stringify(data.certifications) 
             : data.certifications)
          : undefined,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Datos a actualizar:', dataToUpdate);

      // Realizar la actualización directamente
      const { data: updatedData, error } = await supabase
        .from('drivers')
        .update(dataToUpdate)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error en actualización:', error);
        if (error.code === 'PGRST116') {
          return rejectWithValue('Error: No se encontró el conductor con el ID especificado.');
        }
        return rejectWithValue(`Error de base de datos: ${error.message}`);
      }

      console.log('✅ Conductor actualizado exitosamente:', updatedData);
      return updatedData;
    } catch (error) {
      console.error('💥 Error inesperado en updateDriver:', error);
      return rejectWithValue('Error inesperado al actualizar conductor');
    }
  }
);

// Async thunk para desactivar conductor (soft delete)
export const deactivateDriver = createAsyncThunk(
  'drivers/deactivateDriver',
  async (driverId: string, { rejectWithValue }) => {
    try {
      // Verificar si el conductor tiene viajes asignados
      const { data: assignedTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', driverId)
        .in('status', ['booked', 'confirmed']);

      if (tripsError) {
        return rejectWithValue('Error al verificar viajes asignados');
      }

      if (assignedTrips && assignedTrips.length > 0) {
        return rejectWithValue('No se puede desactivar un conductor con viajes activos asignados');
      }

      // Desactivar el conductor
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        console.error('Error deactivating driver:', error);
        return rejectWithValue(error.message);
      }

      return driverId;
    } catch (error) {
      console.error('Error in deactivateDriver:', error);
      return rejectWithValue('Error al desactivar conductor');
    }
  }
);

// Async thunk para activar conductor
export const activateDriver = createAsyncThunk(
  'drivers/activateDriver',
  async (driverId: string, { rejectWithValue }) => {
    try {
      // Activar el conductor
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        console.error('Error activating driver:', error);
        return rejectWithValue(error.message);
      }

      return driverId;
    } catch (error) {
      console.error('Error in activateDriver:', error);
      return rejectWithValue('Error al activar conductor');
    }
  }
);

// Async thunk para eliminar conductor permanentemente (hard delete)
export const deleteDriver = createAsyncThunk(
  'drivers/deleteDriver',
  async (driverId: string, { rejectWithValue }) => {
    try {
      // Verificar si el conductor tiene viajes asignados
      const { data: assignedTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', driverId);

      if (tripsError) {
        return rejectWithValue('Error al verificar viajes asignados');
      }

      if (assignedTrips && assignedTrips.length > 0) {
        return rejectWithValue('No se puede eliminar un conductor con viajes asignados');
      }

      // Eliminar el conductor permanentemente
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) {
        console.error('Error deleting driver:', error);
        return rejectWithValue(error.message);
      }

      return driverId;
    } catch (error) {
      console.error('Error in deleteDriver:', error);
      return rejectWithValue('Error al eliminar conductor');
    }
  }
);

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchDrivers
      .addCase(fetchDrivers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drivers = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // createDriver
      .addCase(createDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drivers.push(action.payload);
      })
      .addCase(createDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateDriver
      .addCase(updateDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.drivers.findIndex(driver => driver.id === action.payload.id);
        if (index !== -1) {
          state.drivers[index] = action.payload;
        }
      })
      .addCase(updateDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // deactivateDriver
      .addCase(deactivateDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.drivers.findIndex(driver => driver.id === action.payload);
        if (index !== -1) {
          state.drivers[index].is_active = false;
          state.drivers[index].updated_at = new Date().toISOString();
        }
      })
      .addCase(deactivateDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // activateDriver
      .addCase(activateDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.drivers.findIndex(driver => driver.id === action.payload);
        if (index !== -1) {
          state.drivers[index].is_active = true;
          state.drivers[index].updated_at = new Date().toISOString();
        }
      })
      .addCase(activateDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // deleteDriver
      .addCase(deleteDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drivers = state.drivers.filter(driver => driver.id !== action.payload);
      })
      .addCase(deleteDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default driversSlice.reducer; 