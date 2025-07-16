'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { getCurrentUser } from '@/store/slices/authSlice';

export default function DashboardPage() {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    // Si no hay usuario, intentar obtenerlo
    if (!user && !isLoading && !hasAttemptedAuth.current) {
      hasAttemptedAuth.current = true;
      dispatch(getCurrentUser());
    }
  }, [user, isLoading, dispatch]);

  useEffect(() => {
    // Redirigir según el rol una vez que tengamos el usuario
    if (user) {
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'client') {
        router.push('/dashboard/client');
      }
    }
  }, [user, router]);

  // Mostrar loading mientras determinamos el rol
  if (isLoading || (!user && !hasAttemptedAuth.current)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de verificar, redirigir al login
  if (!user) {
    router.push('/auth?mode=login');
    return null;
  }

  // Si el usuario no tiene rol válido, mostrar error
  if (user && !['admin', 'client'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Acceso</h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta no tiene un rol válido asignado. Por favor, contacta al administrador.
          </p>
          <button
            onClick={() => router.push('/auth?mode=login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}; 