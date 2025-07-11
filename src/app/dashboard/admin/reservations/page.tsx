'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchReservations, updateReservation } from '@/store/slices/reservationsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';
import { sendSimpleReservationEmail, SimpleReservationData } from '@/lib/emailHelpers';

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

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickup_location: string;
  dropoff_location: string;
  special_requirements?: string;
  contact_phone: string;
  flight_number?: string;
  confirmation_code: string;
  created_at: string;
  updated_at: string;
  trip?: any;
  user?: any;
}

export default function ReservationsManagement() {
  const { reservations, isLoading } = useAppSelector((state) => state.reservations);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      // Obtener todas las reservas para el admin
      dispatch(fetchReservations({}));
    }
  }, [dispatch, user]);

  // Filtrar reservas
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.confirmation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Actualizar estado de reserva
  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    setIsUpdating(true);
    setEmailStatus('');
    
    try {
      // Verificar que la reserva no esté completada
      const currentReservation = reservations.find(r => r.id === reservationId);
      if (currentReservation?.status === 'completed') {
        setToast({
          message: 'No se puede cambiar el estado de una reserva completada',
          type: 'error'
        });
        setIsUpdating(false);
        return;
      }

      const result = await dispatch(updateReservation({
        id: reservationId,
        updates: { status: newStatus as any }
      })).unwrap();

      if (result.success) {
        setToast({
          message: `Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'actualizada'} correctamente`,
          type: 'success'
        });
        
        // Mostrar estado del email
        if (result.emailStatus) {
          setEmailStatus(result.emailStatus);
        }
        
        // Recargar la lista de reservas
        await dispatch(fetchReservations({}));
      } else {
        setToast({
          message: result.error || 'Error al actualizar la reserva',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      setToast({
        message: 'Error al actualizar la reserva',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
      // Limpiar estado de email después de unos segundos
      setTimeout(() => setEmailStatus(''), 5000);
    }
  };

  // Contar reservas por estado
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Volver al Panel</span>
                </button>
                <span className="text-gray-300">|</span>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">Gestión de Reservas</h1>
                </div>
              </div>
              
              {pendingCount > 0 && (
                <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredReservations.length}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <FilterIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                  <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(reservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.total_price, 0))}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Búsqueda */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ubicación, código o cliente..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por estado */}
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Indicador de estado de correos */}
          {emailStatus && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg border-l-4 ${
                emailStatus.includes('✅') 
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : emailStatus.includes('⚠️') 
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                  : 'bg-blue-50 border-blue-400 text-blue-700'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{emailStatus.includes('✅') ? '✅' : emailStatus.includes('⚠️') ? '⚠️' : '📧'}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{emailStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de reservas */}
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
              <p className="text-gray-500 text-lg">No hay reservas que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pasajeros
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {reservation.user?.full_name || 'Cliente'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {reservation.confirmation_code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reservation.pickup_location}
                          </div>
                          <div className="text-sm text-gray-500">
                            → {reservation.dropoff_location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.passenger_count} persona{reservation.passenger_count !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(reservation.total_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                            {getStatusText(reservation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(reservation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedReservation(reservation)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            
                            {reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateReservationStatus(reservation.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="Confirmar"
                                  disabled={isUpdating}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateReservationStatus(reservation.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Cancelar"
                                  disabled={isUpdating}
                                >
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Modal de detalles de reserva */}
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
                {/* Información del cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Nombre</p>
                      <p className="text-gray-900">{selectedReservation.user?.full_name || 'No disponible'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{selectedReservation.user?.email || 'No disponible'}</p>
                    </div>
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

                {/* Detalles del viaje */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Detalles del Viaje</h4>
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
                      <p className="text-sm font-medium text-gray-700">Número de Pasajeros</p>
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
                        <p key={index} className="text-gray-900">
                          {index + 1}. {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReservation.flight_number && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Número de Vuelo</p>
                      <p className="text-gray-900">{selectedReservation.flight_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Estado</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReservation.status)}`}>
                      {getStatusText(selectedReservation.status)}
                    </span>
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

                {/* Acciones */}
                {selectedReservation.status === 'pending' && (
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleUpdateReservationStatus(selectedReservation.id, 'cancelled');
                        setSelectedReservation(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      disabled={isUpdating}
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateReservationStatus(selectedReservation.id, 'confirmed');
                        setSelectedReservation(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={isUpdating}
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast de notificaciones */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 