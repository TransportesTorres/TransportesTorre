'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchReservations, updateReservationStatus } from '@/store/slices/reservationsSlice';
import { fetchTrips } from '@/store/slices/tripsSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

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

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6m-8-6v6m0 0v6a2 2 0 002 2h4a2 2 0 002-2v-6m-8 0H8m8 0h8" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default function AdminDashboard() {
  const { reservations, isLoading } = useAppSelector((state) => state.reservations);
  const { trips } = useAppSelector((state) => state.trips);
  const { drivers, isLoading: driversLoading } = useAppSelector((state) => state.drivers);
  const dispatch = useAppDispatch();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    dispatch(fetchReservations({}));
    dispatch(fetchTrips({}));
    dispatch(fetchDrivers());
  }, [dispatch]);

  // Filtrar solo las solicitudes pendientes
  const pendingRequests = reservations.filter(reservation => 
    reservation.status === 'pending' && !reservation.trip_id
  );

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
  };

  const handleApproveRequest = (request: any) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
    setSelectedDriver('');
  };

  const handleRejectRequest = async (request: any) => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(updateReservationStatus({
        reservationId: request.id,
        status: 'rejected',
        driverId: null
      })).unwrap();

      setToast({
        message: 'Solicitud rechazada exitosamente',
        type: 'success'
      });

      // Recargar las reservas
      dispatch(fetchReservations({}));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al rechazar la solicitud',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApproval = async () => {
    if (!selectedDriver) {
      setToast({
        message: 'Por favor selecciona un conductor',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(updateReservationStatus({
        reservationId: selectedRequest.id,
        status: 'confirmed',
        driverId: selectedDriver
      })).unwrap();

      setToast({
        message: 'Solicitud aprobada exitosamente. Se han enviado las notificaciones.',
        type: 'success'
      });

      // Cerrar modal y recargar datos
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setSelectedDriver('');
      dispatch(fetchReservations({}));
      dispatch(fetchTrips({}));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al aprobar la solicitud',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'No especificada';
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      confirmed: { color: 'bg-green-100 text-green-800', text: 'Confirmada' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazada' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Completada' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelada' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <TruckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-xs text-gray-500">Transportes Torres - Admin</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingRequests.length} solicitudes pendientes
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center">
                <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Solicitudes Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center">
                <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Confirmadas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reservations.filter(r => 
                      r.status === 'confirmed' && 
                      new Date(r.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                  <TruckIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Viajes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conductores Disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Solicitudes de Viaje Pendientes</h2>
              <p className="text-sm text-gray-500 mt-1">
                Revisa y aprueba las solicitudes de transporte de los clientes
              </p>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <CheckIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes pendientes</h3>
                <p className="text-gray-500">Todas las solicitudes han sido procesadas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pasajeros
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
                    {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {request.requester_name || 'Cliente'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.requester_email}
                              </div>
                              {request.company_name && (
                                <div className="text-xs text-gray-400">
                                  {request.company_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.trip_request_origin || 'Origen'} → {request.trip_request_destination || 'Destino'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.flight_number && `✈️ ${request.flight_number}`}
                            {request.flight_type && ` (${request.flight_type})`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            📅 {formatDate(request.service_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            🕒 {formatTime(request.pickup_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            🏠 {request.pickup_location?.substring(0, 30) || 'Sin especificar'}...
                          </div>
                          <div className="text-sm text-gray-500">
                            📍 {request.dropoff_location?.substring(0, 30) || 'Sin especificar'}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            👥 {request.passenger_count} pasajeros
                          </div>
                          <div className="text-sm text-gray-500">
                            🧳 {request.luggage_hand || 0} mano + {request.luggage_checked || 0} bodega
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 inline mr-1" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            disabled={isProcessing}
                          >
                            <CheckIcon className="h-4 w-4 inline mr-1" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            disabled={isProcessing}
                          >
                            <XIcon className="h-4 w-4 inline mr-1" />
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Modal de Detalles de Solicitud */}
        {selectedRequest && !showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles de la Solicitud
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del Solicitante */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Información del Solicitante
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.company_name && (
                        <div>
                          <span className="font-medium text-gray-700">Empresa:</span>
                          <span className="ml-2 text-gray-600">{selectedRequest.company_name}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Nombre:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.requester_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.requester_email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Teléfono:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.contact_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Información del Vuelo */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      ✈️ Información del Vuelo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Número de vuelo:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.flight_number || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.flight_type || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fecha y Hora */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Fecha y Hora del Servicio
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Fecha:</span>
                        <span className="ml-2 text-gray-600">{formatDate(selectedRequest.service_date)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Hora de recogida:</span>
                        <span className="ml-2 text-gray-600">{formatTime(selectedRequest.pickup_time)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ubicaciones */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Ubicaciones
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Origen:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.trip_request_origin}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Destino:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.trip_request_destination}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dirección de recogida:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.pickup_location}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dirección de destino:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.dropoff_location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pasajeros */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Pasajeros
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Número de pasajeros:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.passenger_count}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Nombres:</span>
                        <div className="ml-2 text-gray-600">
                          {selectedRequest.passenger_names?.map((name: string, index: number) => (
                            <div key={index}>• {name}</div>
                          )) || 'No especificados'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipaje */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      🧳 Equipaje
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Maletas de mano:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.luggage_hand || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Maletas sobre 23kg:</span>
                        <span className="ml-2 text-gray-600">{selectedRequest.luggage_checked || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Servicios Adicionales */}
                {(selectedRequest.additional_services || selectedRequest.special_requirements) && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      ⚙️ Servicios y Requerimientos Adicionales
                    </h4>
                    {selectedRequest.additional_services && (
                      <div className="mb-3">
                        <span className="font-medium text-gray-700">Servicios adicionales:</span>
                        <p className="text-gray-600 mt-1">{selectedRequest.additional_services}</p>
                      </div>
                    )}
                    {selectedRequest.special_requirements && (
                      <div>
                        <span className="font-medium text-gray-700">Requerimientos especiales:</span>
                        <p className="text-gray-600 mt-1">{selectedRequest.special_requirements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Precio */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-900">Precio Total Estimado:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${selectedRequest.total_price?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleApproveRequest(selectedRequest)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Aprobar</span>
                </button>
                <button
                  onClick={() => handleRejectRequest(selectedRequest)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <XIcon className="h-4 w-4" />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Aprobación con Selección de Conductor */}
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Aprobar Solicitud - Seleccionar Conductor
                </h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Resumen de la solicitud */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Resumen de la Solicitud</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Cliente: {selectedRequest.requester_name}</div>
                    <div>Fecha: {formatDate(selectedRequest.service_date)} a las {formatTime(selectedRequest.pickup_time)}</div>
                    <div>Ruta: {selectedRequest.trip_request_origin} → {selectedRequest.trip_request_destination}</div>
                    <div>Pasajeros: {selectedRequest.passenger_count}</div>
                    <div>Precio: ${selectedRequest.total_price?.toLocaleString() || '0'}</div>
                  </div>
                </div>

                {/* Selección de conductor */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Seleccionar Conductor Asignado
                  </h4>
                  
                  {driversLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Cargando conductores...</span>
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No hay conductores disponibles
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drivers.map((driver) => (
                        <label
                          key={driver.id}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedDriver === driver.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="driver"
                            value={driver.id}
                            checked={selectedDriver === driver.id}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{driver.full_name}</div>
                                <div className="text-sm text-gray-600">{driver.phone}</div>
                                <div className="text-sm text-gray-600">
                                  {driver.vehicle_info ? 
                                    `${driver.vehicle_info.brand} ${driver.vehicle_info.model} ${driver.vehicle_info.year}` 
                                    : 'Vehículo no especificado'
                                  }
                                </div>
                                <div className="text-xs text-gray-500">
                                  Placa: {driver.vehicle_info?.plate || 'No especificada'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">
                                  Licencia: {driver.license_number || 'No especificada'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Tipo: {driver.license_type || 'No especificado'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {driver.experience_years} años de experiencia
                                </div>
                                <div className="text-xs text-gray-500">
                                  {driver.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información importante */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Al aprobar esta solicitud:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Se creará automáticamente un viaje con el conductor seleccionado</li>
                    <li>• Se enviará una notificación por email al cliente con los detalles</li>
                    <li>• Se enviará una notificación por email al conductor asignado</li>
                    <li>• El estado de la reserva cambiará a "Confirmada"</li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmApproval}
                  disabled={!selectedDriver || isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Confirmar Aprobación</span>
                    </>
                  )}
                </button>
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