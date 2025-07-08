'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchTrips, fetchServiceTypes } from '@/store/slices/tripsSlice';
import { createReservation } from '@/store/slices/reservationsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

// Iconos SVG
const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Tipos
interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time?: string;
  estimated_duration: number;
  service_type_id: string;
  price: number;
  max_passengers: number;
  driver_id: string;
  vehicle_category: string;
  status: string;
  special_instructions?: string;
  includes_tolls: boolean;
  includes_parking: boolean;
  gps_tracking: boolean;
}

export default function ClientTrips() {
  const { trips, serviceTypes, isLoading } = useAppSelector((state) => state.trips);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locales
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [reservationForm, setReservationForm] = useState({
    passenger_count: 1,
    passenger_names: [''],
    pickup_location: '',
    dropoff_location: '',
    special_requirements: '',
    contact_phone: '',
    flight_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (user && user.role === 'client') {
      // Solo obtener viajes disponibles para clientes
      dispatch(fetchTrips({ all: false }));
      dispatch(fetchServiceTypes());
    }
  }, [dispatch, user]);

  // Filtrar ESTRICTAMENTE solo viajes disponibles
  const availableTrips = trips.filter(trip => trip.status === 'available');

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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

  // Obtener nombre del tipo de servicio
  const getServiceTypeName = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(s => s.id === serviceTypeId);
    return serviceType ? serviceType.name : 'Servicio';
  };

  // Manejar selección de viaje
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setReservationForm({
      passenger_count: 1,
      passenger_names: [''],
      pickup_location: trip.origin,
      dropoff_location: trip.destination,
      special_requirements: '',
      contact_phone: user?.phone || '',
      flight_number: ''
    });
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'passenger_count') {
      const count = parseInt(value);
      const names = Array(count).fill('').map((_, i) => reservationForm.passenger_names[i] || '');
      setReservationForm(prev => ({
        ...prev,
        passenger_count: count,
        passenger_names: names
      }));
    } else {
      setReservationForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar cambios en nombres de pasajeros
  const handlePassengerNameChange = (index: number, value: string) => {
    const newNames = [...reservationForm.passenger_names];
    newNames[index] = value;
    setReservationForm(prev => ({
      ...prev,
      passenger_names: newNames
    }));
  };

  // Enviar reserva
  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !user) return;

    setIsSubmitting(true);
    try {
      const reservationData = {
        trip_id: selectedTrip.id,
        user_id: user.id,
        passenger_count: reservationForm.passenger_count,
        passenger_names: reservationForm.passenger_names.filter(name => name.trim() !== ''),
        total_price: selectedTrip.price * reservationForm.passenger_count,
        pickup_location: reservationForm.pickup_location,
        dropoff_location: reservationForm.dropoff_location,
        special_requirements: reservationForm.special_requirements || undefined,
        contact_phone: reservationForm.contact_phone,
        flight_number: reservationForm.flight_number || undefined,
        status: 'pending' as const, // Estado inicial de la reserva
        payment_status: 'pending' as const // Estado inicial del pago
        // confirmation_code se genera automáticamente en la base de datos
      };

      await dispatch(createReservation(reservationData)).unwrap();

      setToast({
        message: 'Reserva enviada exitosamente. Esperando confirmación del administrador.',
        type: 'success'
      });
      setSelectedTrip(null);
    } catch (error) {
      setToast({
        message: 'Error al enviar la reserva. Por favor intenta nuevamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">Viajes Disponibles</h1>
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
              Reserva tu Viaje 🚗
            </h2>
            <p className="text-gray-600 text-lg">
              Selecciona un viaje disponible y completa tu reserva. Un administrador confirmará tu solicitud.
            </p>
          </div>

          {/* Lista de viajes disponibles */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando viajes disponibles...</span>
              </div>
            </div>
          ) : availableTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay viajes disponibles en este momento</p>
              <p className="text-gray-400 mt-2">Por favor vuelve más tarde o contacta con nosotros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Ruta */}
                    <div className="flex items-center space-x-2 mb-4">
                      <MapPinIcon className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-900">
                          {trip.origin} → {trip.destination}
                        </p>
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="flex items-center space-x-2 mb-3">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        {formatDate(trip.departure_time)}
                      </p>
                    </div>

                    {/* Duración */}
                    <div className="flex items-center space-x-2 mb-3">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Duración: {trip.estimated_duration} minutos
                      </p>
                    </div>

                    {/* Servicio */}
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {getServiceTypeName(trip.service_type_id)}
                      </span>
                    </div>

                    {/* Capacidad */}
                    <div className="flex items-center space-x-2 mb-4">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Hasta {trip.max_passengers} pasajeros
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(trip.price)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">por persona</p>
                    </div>

                    {/* Características */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {trip.includes_tolls && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          Incluye peajes
                        </span>
                      )}
                      {trip.includes_parking && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          Incluye parking
                        </span>
                      )}
                      {trip.gps_tracking && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          GPS tracking
                        </span>
                      )}
                    </div>

                    {/* Botón de reservar */}
                    <button
                      onClick={() => handleSelectTrip(trip)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Reservar Viaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal de reserva */}
        {selectedTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Completar Reserva</h3>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Información del viaje seleccionado */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Viaje Seleccionado</h4>
                  <p className="text-lg font-medium text-blue-600">
                    {selectedTrip.origin} → {selectedTrip.destination}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedTrip.departure_time)}
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    {formatPrice(selectedTrip.price)} por persona
                  </p>
                </div>

                {/* Formulario de reserva */}
                <form onSubmit={handleSubmitReservation} className="space-y-6">
                  {/* Número de pasajeros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de pasajeros
                    </label>
                    <select
                      name="passenger_count"
                      value={reservationForm.passenger_count}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Array.from({ length: selectedTrip.max_passengers }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} pasajero{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nombres de pasajeros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres de los pasajeros
                    </label>
                    <div className="space-y-2">
                      {reservationForm.passenger_names.map((name, index) => (
                        <input
                          key={index}
                          type="text"
                          value={name}
                          onChange={(e) => handlePassengerNameChange(index, e.target.value)}
                          placeholder={`Nombre del pasajero ${index + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      ))}
                    </div>
                  </div>

                  {/* Ubicaciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Punto de recogida específico
                      </label>
                      <input
                        type="text"
                        name="pickup_location"
                        value={reservationForm.pickup_location}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección exacta de recogida"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Punto de destino específico
                      </label>
                      <input
                        type="text"
                        name="dropoff_location"
                        value={reservationForm.dropoff_location}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección exacta de destino"
                        required
                      />
                    </div>
                  </div>

                  {/* Teléfono de contacto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de contacto
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={reservationForm.contact_phone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                      required
                    />
                  </div>

                  {/* Número de vuelo (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de vuelo (opcional)
                    </label>
                    <input
                      type="text"
                      name="flight_number"
                      value={reservationForm.flight_number}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="LA123, AA456, etc."
                    />
                  </div>

                  {/* Requerimientos especiales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requerimientos especiales (opcional)
                    </label>
                    <textarea
                      name="special_requirements"
                      value={reservationForm.special_requirements}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Silla de bebé, asistencia especial, etc."
                    />
                  </div>

                  {/* Total a pagar */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">Total a pagar:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(selectedTrip.price * reservationForm.passenger_count)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reservationForm.passenger_count} pasajero{reservationForm.passenger_count > 1 ? 's' : ''} × {formatPrice(selectedTrip.price)}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setSelectedTrip(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Reserva'
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
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 