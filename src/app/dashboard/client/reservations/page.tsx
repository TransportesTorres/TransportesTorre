'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

// Iconos SVG
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const InformationCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Tipos
interface Reservation {
  id: string;
  trip_id: string;
  user_id: string;
  passenger_count: number;
  passenger_names: string[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pickup_location: string;
  dropoff_location: string;
  special_requirements?: string;
  contact_phone: string;
  flight_number?: string;
  confirmation_code: string;
  created_at: string;
  updated_at: string;
  trip?: any;
}

export default function ClientReservations() {
  const { reservations, isLoading } = useAppSelector((state) => state.reservations);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locales
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user && user.role === 'client') {
      // Obtener solo las reservas del cliente
      dispatch(fetchReservations(user.id));
    }
  }, [dispatch, user]);

  // Filtrar reservas por estado
  const filteredReservations = reservations.filter(reservation => {
    if (statusFilter === 'all') return true;
    return reservation.status === statusFilter;
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'confirmed': return <CalendarIcon className="h-4 w-4" />;
      case 'in_progress': return <MapPinIcon className="h-4 w-4" />;
      case 'completed': return <CalendarIcon className="h-4 w-4" />;
      case 'cancelled': return <XIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente de confirmación';
      case 'confirmed': return 'Confirmada';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Obtener descripción del estado
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Tu reserva está siendo revisada por un administrador';
      case 'confirmed': return 'Tu reserva ha sido confirmada. Te contactaremos pronto';
      case 'in_progress': return 'Tu viaje está en curso';
      case 'completed': return 'Tu viaje ha sido completado exitosamente';
      case 'cancelled': return 'Esta reserva ha sido cancelada';
      default: return '';
    }
  };

  // Contar reservas por estado
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const completedCount = reservations.filter(r => r.status === 'completed').length;

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/dashboard/client')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Volver al Panel</span>
                </button>
                <span className="text-gray-300">|</span>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">Cliente</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Información introductoria */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Reservas 📋
            </h2>
            <p className="text-gray-600 text-lg">
              Aquí puedes ver todas tus reservas y hacer seguimiento de su estado.
            </p>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                  <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todas las reservas</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            <button
              onClick={() => router.push('/dashboard/client/trips')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nueva Reserva
            </button>
          </div>

          {/* Lista de reservas */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando reservas...</span>
              </div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {statusFilter === 'all' ? 'No tienes reservas aún' : 'No tienes reservas con este estado'}
              </p>
              <p className="text-gray-400 mt-2">
                {statusFilter === 'all' && '¡Haz tu primera reserva para empezar!'}
              </p>
              {statusFilter === 'all' && (
                <button
                  onClick={() => router.push('/dashboard/client/trips')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buscar Viajes
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Información principal */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <MapPinIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reservation.pickup_location} → {reservation.dropoff_location}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Código: {reservation.confirmation_code}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {reservation.passenger_count} pasajero{reservation.passenger_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatPrice(reservation.total_price)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatDate(reservation.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Estado */}
                        <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          <div>
                            <p className="text-sm font-medium">{getStatusText(reservation.status)}</p>
                            <p className="text-xs">{getStatusDescription(reservation.status)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botón de ver detalles */}
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal de detalles */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Detalles de la Reserva</h3>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Estado actual */}
                <div className={`p-4 rounded-lg border ${getStatusColor(selectedReservation.status)}`}>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(selectedReservation.status)}
                    <div>
                      <p className="font-medium">{getStatusText(selectedReservation.status)}</p>
                      <p className="text-sm">{getStatusDescription(selectedReservation.status)}</p>
                    </div>
                  </div>
                </div>

                {/* Información del viaje */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información del Viaje</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Origen</p>
                      <p className="text-gray-900">{selectedReservation.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Destino</p>
                      <p className="text-gray-900">{selectedReservation.dropoff_location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pasajeros</p>
                      <p className="text-gray-900">{selectedReservation.passenger_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Precio Total</p>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedReservation.total_price)}</p>
                    </div>
                  </div>
                </div>

                {/* Nombres de pasajeros */}
                {selectedReservation.passenger_names && selectedReservation.passenger_names.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Pasajeros</h4>
                    <div className="space-y-2">
                      {selectedReservation.passenger_names.map((name, index) => (
                        <p key={index} className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {index + 1}. {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información de contacto */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información de Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Teléfono</p>
                      <p className="text-gray-900">{selectedReservation.contact_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Código de Confirmación</p>
                      <p className="text-gray-900 font-mono">{selectedReservation.confirmation_code}</p>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReservation.flight_number && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Número de Vuelo</p>
                      <p className="text-gray-900">{selectedReservation.flight_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fecha de Reserva</p>
                    <p className="text-gray-900">{formatDate(selectedReservation.created_at)}</p>
                  </div>
                </div>

                {/* Requerimientos especiales */}
                {selectedReservation.special_requirements && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Requerimientos Especiales</h4>
                    <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg">
                      {selectedReservation.special_requirements}
                    </p>
                  </div>
                )}

                {/* Información de ayuda */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Información Importante</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Si tienes alguna pregunta sobre tu reserva, puedes contactarnos usando el código de confirmación: <span className="font-mono font-medium">{selectedReservation.confirmation_code}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 