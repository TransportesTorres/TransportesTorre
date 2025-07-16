'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCurrentUser } from '@/store/slices/authSlice';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la aplicación
    if (!user && !isLoading && !hasAttemptedAuth.current) {
      hasAttemptedAuth.current = true;
      dispatch(getCurrentUser());
    }
  }, [dispatch, user, isLoading]);

  if (isLoading && !hasAttemptedAuth.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 