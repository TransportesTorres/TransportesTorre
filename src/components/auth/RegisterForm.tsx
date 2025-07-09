'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearError } from '@/store/slices/authSlice';
import { RegisterCredentials } from '@/types';

interface RegisterFormProps {
  onToggleForm?: () => void;
}

// Iconos SVG personalizados
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<{
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    confirmPassword: string;
  }>();

  const password = watch('password');

  const onSubmit = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    confirmPassword: string;
  }) => {
    try {
      const { confirmPassword, ...registerData } = data;
      // Fijar el rol como 'client' por defecto
      const registerDataWithRole = { ...registerData, role: 'client' as const };
      const result = await dispatch(registerUser(registerDataWithRole)).unwrap();
      
      if (result) {
        // Mostrar mensaje de éxito
        setRegistrationSuccess(true);
        
        // Esperar 2 segundos y luego redirigir al login
        setTimeout(() => {
          // Si estamos en la página /auth, cambiar al modo login con parámetro
          if (window.location.pathname === '/auth') {
            router.push('/auth?mode=login&from=registration');
          } else if (onToggleForm) {
            // Si estamos en otro contexto, usar el toggle
            onToggleForm();
          } else {
            // Fallback: ir a auth con modo login
            router.push('/auth?mode=login&from=registration');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
    }
  };

  const handleClearError = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  // Mostrar mensaje de éxito
  if (registrationSuccess) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada correctamente. <br />
            <strong>Revisa tu email</strong> para confirmar tu cuenta y poder iniciar sesión.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Verifica tu bandeja de entrada
                </p>
                <p className="text-sm text-blue-700">
                  Hemos enviado un enlace de confirmación a tu email. Haz clic en el enlace para activar tu cuenta.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-600 font-medium">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
          <UserPlusIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Únete a nosotros!</h2>
        <p className="text-gray-600">Crea tu cuenta para comenzar a reservar</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl relative animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={handleClearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-1 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'full_name' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="full_name"
                type="text"
                {...register('full_name', {
                  required: 'El nombre completo es requerido',
                  minLength: {
                    value: 2,
                    message: 'El nombre debe tener al menos 2 caracteres',
                  },
                })}
                onFocus={() => setFocusedField('full_name')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.full_name
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'full_name'
                    ? 'border-blue-300 focus:ring-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                }`}
                placeholder="Juan Pérez"
              />
            </div>
            {errors.full_name && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Ingresa un correo electrónico válido',
                  },
                })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'email'
                    ? 'border-blue-300 focus:ring-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                }`}
                placeholder="tu@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'phone' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  focusedField === 'phone'
                    ? 'border-blue-300 focus:ring-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                }`}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'password'
                    ? 'border-blue-300 focus:ring-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'confirmPassword' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (value) =>
                    value === password || 'Las contraseñas no coinciden',
                })}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'confirmPassword'
                    ? 'border-blue-300 focus:ring-blue-500 bg-blue-50'
                    : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Por qué te registras como cliente?</p>
              <p>Los clientes pueden reservar viajes, ver su historial y recibir notificaciones. Los administradores son creados por el equipo de Transportes Torres.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform ${
            isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando tu cuenta...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Crear Mi Cuenta
            </div>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
          </div>
        </div>
        <button
          onClick={onToggleForm}
          className="mt-4 w-full flex justify-center py-3 px-4 border border-blue-300 rounded-xl shadow-sm text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
} 