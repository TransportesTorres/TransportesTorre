'use client';

import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push('/auth?mode=login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Cuenta Confirmada!</h2>
              <p className="text-gray-600 mb-8">
                Tu email ha sido verificado exitosamente. <br />
                Ahora puedes iniciar sesión con tus credenciales.
              </p>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Iniciar Sesión
              </button>
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