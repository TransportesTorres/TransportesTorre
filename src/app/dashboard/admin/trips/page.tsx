'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { 
  fetchTrips, 
  fetchTripsWithReservations, 
  fetchServiceTypes, 
  fetchDrivers, 
  fetchVehicleCategories, 
  createTrip, 
  updateTrip, 
  deleteTrip, 
  completeTrip, 
  cancelTrip 
} from '@/store/slices/tripsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';
import { Trip, ServiceType, Driver, VehicleCategory } from '@/types';

// Iconos SVG
const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function TripsManagement() {
  const { trips, drivers, serviceTypes, vehicleCategories, isLoading, error } = useAppSelector((state) => state.trips);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Debug: Mostrar estados en consola
  useEffect(() => {
    console.log('🔧 Estado editingTrip:', editingTrip);
  }, [editingTrip]);

  useEffect(() => {
    console.log('🗑️ Estado showDeleteModal:', showDeleteModal);
  }, [showDeleteModal]);

  useEffect(() => {
    console.log('📊 Viajes cargados:', trips.length, trips);
  }, [trips]);

  useEffect(() => {
    if (toast) {
      console.log('🔔 Toast mostrado:', toast);
    }
  }, [toast]);
  
  // Estados para el formulario de edición
  const [editFormData, setEditFormData] = useState({
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    estimated_duration: 0,
    service_type_id: '',
    price: 0,
    max_passengers: 1,
    driver_id: '',
    vehicle_category: '',
    special_instructions: '',
    includes_tolls: true,
    includes_parking: true,
    gps_tracking: true
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      // Obtener viajes con información de reservas
      dispatch(fetchTripsWithReservations());
      dispatch(fetchServiceTypes());
      dispatch(fetchDrivers());
      dispatch(fetchVehicleCategories());
    }
  }, [dispatch, user]);

  // Filtrar viajes
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Debug: Mostrar viajes filtrados
  useEffect(() => {
    console.log('🔍 Viajes filtrados:', filteredTrips.length, filteredTrips);
  }, [filteredTrips]);

  // Obtener nombre del conductor
  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.full_name : 'Driver no encontrado';
  };

  // Obtener información del vehículo
  const getVehicleInfo = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || !driver.vehicle_info) return 'Vehículo no encontrado';
    return `${driver.vehicle_info.brand} ${driver.vehicle_info.model} (${driver.vehicle_info.plate})`;
  };

  // Obtener información de reservas de un viaje
  const getReservationInfo = (trip: any) => {
    if (!trip.reservations || trip.reservations.length === 0) {
      return { count: 0, status: 'Sin reservas', clientName: null };
    }
    
    const reservation = trip.reservations[0]; // Asumiendo una reserva por viaje
    const clientName = reservation.profiles?.full_name || 'Cliente desconocido';
    
    return {
      count: trip.reservations.length,
      status: getStatusText(reservation.status),
      clientName: clientName,
      totalPassengers: reservation.passenger_count
    };
  };

  // Obtener nombre del tipo de servicio
  const getServiceTypeName = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(s => s.id === serviceTypeId);
    return serviceType ? serviceType.name : 'Servicio no encontrado';
  };

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
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'booked': return 'Reservado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Cambiar estado del viaje
  const handleStatusChange = async (tripId: string, newStatus: string) => {
    try {
      // Verificar que el viaje no esté completado
      const currentTrip = trips.find(t => t.id === tripId);
      if (currentTrip?.status === 'completed') {
        setToast({
          message: 'No se puede cambiar el estado de un viaje completado',
          type: 'error'
        });
        return;
      }

      if (newStatus === 'completed') {
        // Usar la función especial completeTrip que envía correo de finalización
        await dispatch(completeTrip(tripId)).unwrap();
        setToast({
          message: 'Viaje completado exitosamente y correo de finalización enviado',
          type: 'success'
        });
      } else if (newStatus === 'cancelled') {
        // Usar la función especial cancelTrip que envía correos de cancelación
        await dispatch(cancelTrip(tripId)).unwrap();
        setToast({
          message: 'Viaje cancelado exitosamente y notificaciones enviadas',
          type: 'success'
        });
      } else {
        // Para otros estados, usar updateTrip normal
        await dispatch(updateTrip({ id: tripId, updates: { status: newStatus as any } })).unwrap();
        setToast({
          message: 'Estado del viaje actualizado exitosamente',
          type: 'success'
        });
      }
    } catch (error) {
      setToast({
        message: 'Error al actualizar el estado del viaje',
        type: 'error'
      });
    }
  };

  // Eliminar viaje
  const handleDeleteTrip = async (tripId: string) => {
    console.log('🔥 Iniciando eliminación de viaje:', tripId);
    try {
      await dispatch(deleteTrip(tripId)).unwrap();
      console.log('✅ Viaje eliminado exitosamente');
      setToast({
        message: 'Viaje eliminado exitosamente',
        type: 'success'
      });
      setShowDeleteModal(null);
    } catch (error) {
      console.error('❌ Error al eliminar viaje:', error);
      setToast({
        message: 'Error al eliminar el viaje',
        type: 'error'
      });
    }
  };

  // Inicializar formulario de edición cuando se selecciona un viaje
  useEffect(() => {
    console.log('🔧 Inicializando formulario para:', editingTrip?.id);
    if (editingTrip) {
      setEditFormData({
        origin: editingTrip.origin,
        destination: editingTrip.destination,
        departure_time: editingTrip.departure_time.slice(0, 16), // Formato para input datetime-local
        arrival_time: editingTrip.arrival_time ? editingTrip.arrival_time.slice(0, 16) : '',
        estimated_duration: editingTrip.estimated_duration,
        service_type_id: editingTrip.service_type_id,
        price: editingTrip.price,
        max_passengers: editingTrip.max_passengers,
        driver_id: editingTrip.driver_id,
        vehicle_category: editingTrip.vehicle_category,
        special_instructions: editingTrip.special_instructions || '',
        includes_tolls: editingTrip.includes_tolls,
        includes_parking: editingTrip.includes_parking,
        gps_tracking: editingTrip.gps_tracking
      });
    }
  }, [editingTrip]);

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    console.log('📝 Cambio en formulario:', name, '=', value);
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setEditFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar envío del formulario de edición
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Enviando formulario de edición para:', editingTrip?.id);
    if (!editingTrip) return;

    setIsUpdating(true);
    try {
      // Limpiar datos antes de enviar
      const cleanedData = {
        ...editFormData,
        arrival_time: editFormData.arrival_time || undefined,
        special_instructions: editFormData.special_instructions || undefined,
        estimated_duration: parseInt(editFormData.estimated_duration.toString()),
        max_passengers: parseInt(editFormData.max_passengers.toString()),
        price: parseFloat(editFormData.price.toString()),
        vehicle_category: editFormData.vehicle_category as any
      };

      console.log('📦 Datos a enviar:', cleanedData);

      await dispatch(updateTrip({ 
        id: editingTrip.id, 
        updates: cleanedData 
      })).unwrap();

      console.log('✅ Viaje actualizado exitosamente');
      setToast({
        message: 'Viaje actualizado exitosamente',
        type: 'success'
      });
      setEditingTrip(null);
    } catch (error) {
      console.error('❌ Error al actualizar viaje:', error);
      setToast({
        message: 'Error al actualizar el viaje',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">Gestión de Viajes</h1>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/dashboard/admin/trips/create')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Crear Viaje</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros y búsqueda */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Búsqueda */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por origen o destino..."
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
                  <option value="available">Disponibles</option>
                  <option value="booked">Reservados</option>
                  <option value="completed">Completados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Total: {filteredTrips.length}</span>
              <span>Disponibles: {filteredTrips.filter(t => t.status === 'available').length}</span>
              <span>Reservados: {filteredTrips.filter(t => t.status === 'booked').length}</span>
            </div>
          </div>

          {/* Tabla de viajes */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando viajes...</span>
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay viajes que coincidan con los filtros</p>
              <button
                onClick={() => router.push('/dashboard/admin/trips/create')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear primer viaje
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conductor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente/Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.origin} → {trip.destination}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.estimated_duration} min • {trip.max_passengers} pasajeros
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(trip.departure_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getServiceTypeName(trip.service_type_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getDriverName(trip.driver_id)}</div>
                          <div className="text-sm text-gray-500">{getVehicleInfo(trip.driver_id)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const reservationInfo = getReservationInfo(trip);
                            if (reservationInfo.clientName) {
                              return (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {reservationInfo.clientName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {reservationInfo.count} reserva(s) • {reservationInfo.status}
                                  </div>
                                  {reservationInfo.totalPassengers && (
                                    <div className="text-xs text-blue-600">
                                      {reservationInfo.totalPassengers} pasajero(s)
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-sm text-gray-500 italic">
                                  Sin reservas
                                </div>
                              );
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={trip.status}
                            onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                            disabled={trip.status === 'completed'}
                            className={`text-sm rounded-full px-3 py-1 font-medium border-0 ${getStatusColor(trip.status)} ${trip.status === 'completed' ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <option value="available">Disponible</option>
                            <option value="booked">Reservado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                console.log('🔧 Editando viaje:', trip.id, trip);
                                setEditingTrip(trip);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                console.log('🗑️ Eliminando viaje:', trip.id);
                                setShowDeleteModal(trip.id);
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
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

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-500 mb-6">
                ¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    console.log('❌ Cancelando eliminación');
                    setShowDeleteModal(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    console.log('🔥 Confirmando eliminación para:', showDeleteModal);
                    handleDeleteTrip(showDeleteModal);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición de viaje */}
        {editingTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Viaje: {editingTrip.origin} → {editingTrip.destination}
                  </h3>
                  <button
                    onClick={() => {
                      console.log('❌ Cerrando modal de edición');
                      setEditingTrip(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Información de la ruta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Origen
                      </label>
                      <input
                        type="text"
                        name="origin"
                        value={editFormData.origin}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lugar de origen"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destino
                      </label>
                      <input
                        type="text"
                        name="destination"
                        value={editFormData.destination}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lugar de destino"
                        required
                      />
                    </div>
                  </div>

                  {/* Fechas y duración */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha y hora de salida
                      </label>
                      <input
                        type="datetime-local"
                        name="departure_time"
                        value={editFormData.departure_time}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha y hora de llegada (opcional)
                      </label>
                      <input
                        type="datetime-local"
                        name="arrival_time"
                        value={editFormData.arrival_time}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración estimada (minutos)
                      </label>
                      <input
                        type="number"
                        name="estimated_duration"
                        value={editFormData.estimated_duration}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Servicio y conductor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de servicio
                      </label>
                      <select
                        name="service_type_id"
                        value={editFormData.service_type_id}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar servicio</option>
                        {serviceTypes.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conductor
                      </label>
                      <select
                        name="driver_id"
                        value={editFormData.driver_id}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar conductor</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.full_name} - {driver.vehicle_info.brand} {driver.vehicle_info.model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Categoría de vehículo y pasajeros */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría de vehículo
                      </label>
                      <select
                        name="vehicle_category"
                        value={editFormData.vehicle_category}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {vehicleCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name} - {category.max_passengers} pasajeros
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número máximo de pasajeros
                      </label>
                      <input
                        type="number"
                        name="max_passengers"
                        value={editFormData.max_passengers}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="50"
                        required
                      />
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Instrucciones especiales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones especiales (opcional)
                    </label>
                    <textarea
                      name="special_instructions"
                      value={editFormData.special_instructions}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Instrucciones adicionales para el conductor o el viaje"
                    />
                  </div>

                  {/* Opciones adicionales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="includes_tolls"
                        checked={editFormData.includes_tolls}
                        onChange={handleEditFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Incluye peajes
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="includes_parking"
                        checked={editFormData.includes_parking}
                        onChange={handleEditFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Incluye estacionamiento
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="gps_tracking"
                        checked={editFormData.gps_tracking}
                        onChange={handleEditFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Seguimiento GPS
                      </label>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingTrip(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={isUpdating}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                          Actualizando...
                        </>
                      ) : (
                        'Actualizar Viaje'
                      )}
                    </button>
                  </div>
                </form>
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
            onClose={() => {
              console.log('❌ Cerrando toast');
              setToast(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 