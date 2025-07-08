'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { getCurrentUser } from '@/store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'client';
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    // Si no hay usuario, intentar obtenerlo
    if (!user && !isLoading) {
      dispatch(getCurrentUser());
    }
  }, [user, isLoading, dispatch]);

  useEffect(() => {
    if (!isLoading && !user) {
      // Si no hay usuario y no está cargando, redirigir a login
      router.push('/auth?mode=login');
      return;
    }

    if (user && requiredRole && user.role !== requiredRole) {
      // Si el usuario no tiene el rol requerido, redirigir
      router.push(redirectTo);
      return;
    }
  }, [user, isLoading, requiredRole, redirectTo, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene el rol requerido, no mostrar el contenido
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
} 