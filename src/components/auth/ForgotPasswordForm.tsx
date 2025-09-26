'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetPassword, clearError } from '@/store/slices/authSlice';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

// Iconos SVG personalizados
const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await dispatch(resetPassword(data.email)).unwrap();
      setIsSuccess(true);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
    }
  };

  const handleClearError = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  const handleBack = () => {
    if (isSuccess) {
      setIsSuccess(false);
    } else if (onBack) {
      onBack();
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Correo enviado!</h2>
          <p className="text-gray-600">Revisa tu bandeja de entrada</p>
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Se ha enviado un enlace de restablecimiento a <strong>{getValues('email')}</strong>
              </p>
              <p className="text-sm mt-1">
                Haz clic en el enlace del correo para restablecer tu contraseña. 
                Si no lo ves, revisa tu carpeta de spam.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="w-full flex justify-center items-center py-3 px-4 border border-blue-300 rounded-xl shadow-sm text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al inicio de sesión
          </button>

          <button
            onClick={() => onSubmit(getValues())}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            {isLoading ? 'Enviando...' : 'Reenviar correo'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
          <MailIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h2>
        <p className="text-gray-600">Te enviaremos un enlace para restablecerla</p>
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
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className={`h-5 w-5 transition-colors duration-200 ${
                focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
              }`} />
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
              className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
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

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform ${
              isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando correo...
              </div>
            ) : (
              <div className="flex items-center">
                <MailIcon className="h-5 w-5 mr-2" />
                Enviar enlace de recuperación
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al inicio de sesión
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">¿Recordaste tu contraseña?</span>
          </div>
        </div>
      </div>
    </div>
  );
} 