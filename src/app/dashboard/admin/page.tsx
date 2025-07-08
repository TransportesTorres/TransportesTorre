'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import { fetchTrips, cancelTrip } from '@/store/slices/tripsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

// Iconos SVG personalizados
const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

export default function AdminDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { reservations, isLoading: reservationsLoading } = useAppSelector((state) => state.reservations);
  const { trips, isLoading: tripsLoading } = useAppSelector((state) => state.trips);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados para UI
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Si no es admin, redirigir
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Cargar todos los datos para el admin
    if (user) {
      dispatch(fetchReservations()); // Sin userId para obtener todas las reservas
      dispatch(fetchTrips({ all: true })); // Todos los viajes
    }
  }, [user, dispatch, router]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Función para cancelar viaje directamente
  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este viaje? Se enviarán notificaciones a los clientes afectados.')) {
      return;
    }

    setIsUpdating(true);
    try {
      await dispatch(cancelTrip(tripId)).unwrap();
      setToast({
        message: 'Viaje cancelado exitosamente y notificaciones enviadas',
        type: 'success'
      });
      // Recargar datos
      dispatch(fetchTrips({ all: true }));
    } catch (error) {
      console.error('Error al cancelar viaje:', error);
      setToast({
        message: 'Error al cancelar el viaje',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const today = new Date().toDateString();
  const todayReservations = reservations.filter(r => 
    new Date(r.created_at).toDateString() === today
  );
  
  const totalRevenue = reservations
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.total_price, 0);

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const availableTrips = trips.filter(t => t.status === 'available');

  const recentReservations = reservations.slice(0, 5);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <TruckIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Transportes Torres
                </h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notificación de reservas pendientes */}
              {pendingReservations.length > 0 && (
                <button
                  onClick={() => router.push('/dashboard/admin/reservations')}
                  className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full hover:bg-yellow-200 transition-colors"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {pendingReservations.length} reserva{pendingReservations.length !== 1 ? 's' : ''} pendiente{pendingReservations.length !== 1 ? 's' : ''}
                  </span>
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <CogIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user.full_name}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración 🚛
          </h2>
          <p className="text-gray-600 text-lg">
            Gestiona todos los aspectos de Transportes Torres desde aquí.
          </p>
        </div>

        {/* Estadísticas del día */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Reservas de hoy */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{todayReservations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {todayReservations.length > 0 ? '+' + Math.round((todayReservations.length / reservations.length) * 100) + '% del total' : 'Ninguna reserva hoy'}
            </p>
          </div>

          {/* Ingresos totales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Viajes completados
            </p>
          </div>

          {/* Reservas pendientes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900">{pendingReservations.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <UsersIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Requieren atención
            </p>
          </div>

          {/* Viajes disponibles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Viajes Activos</p>
                <p className="text-3xl font-bold text-gray-900">{availableTrips.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Disponibles para reserva
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/admin/trips/create')}
              className="flex items-center space-x-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-6 w-6" />
              <span className="font-medium">Crear Nuevo Viaje</span>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/admin/trips')}
              className="flex items-center space-x-3 p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <TruckIcon className="h-6 w-6" />
              <span className="font-medium">Gestionar Viajes</span>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/admin/reservations')}
              className="flex items-center space-x-3 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors relative"
            >
              <CalendarIcon className="h-6 w-6" />
              <span className="font-medium">Gestionar Reservas</span>
              {pendingReservations.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {pendingReservations.length}
                </div>
              )}
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              <ChartBarIcon className="h-6 w-6" />
              <span className="font-medium">Ver Reportes</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Reservas recientes */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver todas
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {reservationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando reservas...</p>
                </div>
              ) : recentReservations.length > 0 ? (
                <div className="space-y-4">
                  {recentReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <MapPinIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {reservation.pickup_location} → {reservation.dropoff_location}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cliente: {reservation.user?.full_name || 'N/A'} • ${reservation.total_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {reservation.status === 'confirmed' ? 'Confirmado' :
                           reservation.status === 'pending' ? 'Pendiente' :
                           reservation.status === 'completed' ? 'Completado' :
                           'Cancelado'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(reservation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No hay reservas aún</p>
                  <p className="text-sm text-gray-400">Las reservas aparecerán aquí cuando los clientes las hagan</p>
                </div>
              )}
            </div>
          </div>

          {/* Gestión de viajes */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Viajes</h3>
                <button 
                  onClick={() => router.push('/dashboard/admin/trips')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Gestionar todo
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {tripsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando viajes...</p>
                </div>
              ) : availableTrips.length > 0 ? (
                <div className="space-y-4">
                  {availableTrips.slice(0, 4).map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <TruckIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {trip.origin} → {trip.destination}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(trip.departure_time).toLocaleDateString()} • {trip.max_passengers} asientos • ${trip.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // Ir a la página de gestión de viajes con foco en este viaje
                            console.log('Editando viaje:', trip.id, trip.origin, '→', trip.destination);
                            router.push(`/dashboard/admin/trips`);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleCancelTrip(trip.id)}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No hay viajes activos</p>
                  <p className="text-sm text-gray-400">Crea tu primer viaje para empezar</p>
                  <button 
                    onClick={() => router.push('/dashboard/admin/trips/create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Crear Viaje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* Toast de notificaciones */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={true}
        onClose={() => setToast(null)}
      />
    )}
    </ProtectedRoute>
  );
} 