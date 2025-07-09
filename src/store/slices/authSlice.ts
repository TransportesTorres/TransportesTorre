import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/supabase/supabase';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '@/types';

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

// Async thunks para autenticación
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (profileError) {
        return rejectWithValue(profileError.message);
      }

      return profile as User;
    } catch (error) {
      return rejectWithValue('Error al iniciar sesión');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      // La base de datos ahora se encarga de crear el perfil a través de un trigger.
      // El frontend solo necesita registrar al usuario en el sistema de autenticación.
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          // Estos datos serán leídos por el trigger en la base de datos.
          data: {
            full_name: credentials.full_name,
            phone: credentials.phone,
          },
        },
      });

      if (error) {
        console.error('Error en Supabase signUp:', error);
        return rejectWithValue(error.message);
      }

      // Con la confirmación por email activada, data.user existe pero data.session es null.
      // Esto es esperado. Simplemente devolvemos el usuario para indicar éxito.
      if (!data.user) {
        console.error('Respuesta de signUp inválida, no se encontró el usuario:', data);
        return rejectWithValue('No se pudo crear el usuario. Respuesta de Supabase inválida.');
      }

      // La operación fue exitosa. No devolvemos un perfil completo porque
      // el usuario no está "logueado" hasta que confirme su email.
      // La UI debe mostrar un mensaje pidiendo al usuario que revise su correo.
      return { success: true, user: data.user };

    } catch (e: any) {
      console.error('Error inesperado en registerUser:', e);
      return rejectWithValue(e.message || 'Ocurrió un error inesperado durante el registro.');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return rejectWithValue(error.message);
      }
      return null;
    } catch (error) {
      return rejectWithValue('Error al cerrar sesión');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return rejectWithValue(profileError.message);
      }

      return profile as User;
    } catch (error) {
      return rejectWithValue('Error al obtener usuario actual');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { full_name?: string; phone?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const userId = state.auth.user?.id;

      if (!userId) {
        return rejectWithValue('Usuario no autenticado');
      }

      // Actualizar perfil en la base de datos
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as User;
    } catch (error) {
      return rejectWithValue('Error al actualizar perfil');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      // Primero verificar la contraseña actual intentando hacer login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        return rejectWithValue('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        return rejectWithValue('Contraseña actual incorrecta');
      }

      // Cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        return rejectWithValue(updateError.message);
      }

      return { success: true, message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      return rejectWithValue('Error al cambiar contraseña');
    }
  }
);

export const resendConfirmation = createAsyncThunk(
  'auth/resendConfirmation',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      return { success: true };
    } catch (error) {
      return rejectWithValue('Error al reenviar el email de confirmación');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        // Después del registro, el usuario NO se loguea automáticamente.
        // Simplemente paramos el indicador de carga y limpiamos errores.
        // La UI se encargará de mostrar el mensaje de "revisa tu email".
        state.isLoading = false;
        state.error = null;
        // No establecemos state.user aquí.
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer; 