'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePassword, clearError } from '@/store/slices/authSlice';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

// Iconos SVG personalizados
const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await dispatch(updatePassword(data.password)).unwrap();
      setIsSuccess(true);
      
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }, 3000);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
    }
  };

  const handleClearError = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-600">Tu contraseña se ha cambiado exitosamente</p>
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Tu contraseña ha sido actualizada correctamente
              </p>
              <p className="text-sm mt-1">
                Serás redirigido al panel de control automáticamente...
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
          <LockIcon className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restablecer contraseña</h2>
        <p className="text-gray-600">Ingresa tu nueva contraseña</p>
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
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-red-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un símbolo',
                  },
                })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'password'
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-red-500 bg-white hover:border-gray-400'
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
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className={`h-5 w-5 transition-colors duration-200 ${
                  focusedField === 'confirmPassword' ? 'text-red-600' : 'text-gray-400'
                }`} />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (value) =>
                    value === password || 'Las contraseñas no coinciden',
                })}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : focusedField === 'confirmPassword'
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-red-500 bg-white hover:border-gray-400'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
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

        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Requisitos de la contraseña:</h3>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <span className={`mr-2 ${password && password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                {password && password.length >= 8 ? '✓' : '•'}
              </span>
              Al menos 8 caracteres
            </li>
            <li className="flex items-center">
              <span className={`mr-2 ${password && /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                {password && /[A-Z]/.test(password) ? '✓' : '•'}
              </span>
              Una letra mayúscula
            </li>
            <li className="flex items-center">
              <span className={`mr-2 ${password && /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                {password && /[a-z]/.test(password) ? '✓' : '•'}
              </span>
              Una letra minúscula
            </li>
            <li className="flex items-center">
              <span className={`mr-2 ${password && /\d/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                {password && /\d/.test(password) ? '✓' : '•'}
              </span>
              Un número
            </li>
            <li className="flex items-center">
              <span className={`mr-2 ${password && /[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                {password && /[@$!%*?&]/.test(password) ? '✓' : '•'}
              </span>
              Un símbolo (@$!%*?&)
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform ${
            isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Actualizando contraseña...
            </div>
          ) : (
            <div className="flex items-center">
              <LockIcon className="h-5 w-5 mr-2" />
              Restablecer contraseña
            </div>
          )}
        </button>
      </form>
    </div>
  );
} 