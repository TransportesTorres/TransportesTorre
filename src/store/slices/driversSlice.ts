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
  };
  certifications: {
    road_safety: boolean;
    customer_service: boolean;
    last_training_date?: string;
    transport_regulations?: boolean;
  };
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

// Async thunk para obtener conductores
export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

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

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default driversSlice.reducer; 