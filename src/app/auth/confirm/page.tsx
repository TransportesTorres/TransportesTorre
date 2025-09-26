'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmationStatus, setConfirmationStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleConfirmation = async () => {
      // Verificar parámetros de error en la URL
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      // También verificar parámetros en el hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error');
      const hashErrorCode = hashParams.get('error_code');
      const hashErrorDescription = hashParams.get('error_description');

      // Verificar si hay tokens de confirmación
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      const finalError = error || hashError;
      const finalErrorCode = errorCode || hashErrorCode;
      const finalErrorDescription = errorDescription || hashErrorDescription;

      if (finalError) {
        setConfirmationStatus('error');
        
        // Personalizar mensajes de error según el código
        switch (finalErrorCode) {
          case 'otp_expired':
            setErrorMessage('El enlace de confirmación ha expirado. Solicita un nuevo enlace de confirmación.');
            break;
          case 'access_denied':
            setErrorMessage('El enlace de confirmación es inválido o ya ha sido usado.');
            break;
          default:
            setErrorMessage(
              finalErrorDescription?.replace(/\+/g, ' ') || 
              'Ha ocurrido un error al confirmar tu cuenta. Por favor, inténtalo de nuevo.'
            );
        }
      } else if (type === 'signup' && accessToken && refreshToken) {
        // Este es un enlace de confirmación válido, procesar automáticamente
        try {
          const { supabase } = await import('@/supabase/supabase');
          
          // Establecer la sesión con los tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
          }

          // Confirmación exitosa
          setConfirmationStatus('success');
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            router.push('/auth?mode=login&from=confirmation');
          }, 3000);

        } catch (error) {
          console.error('Error al confirmar cuenta:', error);
          setConfirmationStatus('error');
          setErrorMessage('Error al procesar la confirmación. Por favor, inténtalo de nuevo.');
        }
      } else {
        // No hay parámetros claros, verificar si ya hay una sesión activa
        try {
          const { supabase } = await import('@/supabase/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setConfirmationStatus('success');
          } else {
            setConfirmationStatus('error');
            setErrorMessage('No se encontró una confirmación válida.');
          }
        } catch (error) {
          setConfirmationStatus('error');
          setErrorMessage('Error al verificar la confirmación.');
        }
      }
    };

    handleConfirmation();
  }, [searchParams, router]);

  const handleGoToLogin = () => {
    router.push('/auth?mode=login');
  };

  const handleRequestNewLink = () => {
    router.push('/auth?mode=login&resend=true');
  };

  // Estado de carga
  if (confirmationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando confirmación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center">
              {confirmationStatus === 'success' ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Cuenta Confirmada!</h2>
                  <p className="text-gray-600 mb-6">
                    Tu email ha sido verificado exitosamente. <br />
                    Ahora puedes iniciar sesión con tus credenciales.
                  </p>
                  
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-3"></div>
                      <p className="text-sm font-medium">Redirigiendo al inicio de sesión...</p>
                    </div>
                  </div>

                  <button
                    onClick={handleGoToLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Ir al Inicio de Sesión Ahora
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Error de Confirmación</h2>
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    <p className="text-sm font-medium">{errorMessage}</p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleRequestNewLink}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Solicitar Nuevo Enlace
                    </button>
                    <button
                      onClick={handleGoToLogin}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                      Volver al Inicio de Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? {' '}
            <a href="mailto:soporte@transportestorres.com" className="text-blue-600 hover:text-blue-800 font-medium">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
} 