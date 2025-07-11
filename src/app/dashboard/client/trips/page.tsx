'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchServiceTypes, fetchVehicleCategories } from '@/store/slices/tripsSlice';
import { createReservation } from '@/store/slices/reservationsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

// Iconos SVG
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
  </svg>
);

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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.341" />
  </svg>
);

export default function ClientTripRequest() {
  const { serviceTypes, vehicleCategories, isLoading } = useAppSelector((state) => state.trips);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Información de la empresa/solicitante
    company_name: '',
    requester_name: user?.full_name || '',
    requester_email: user?.email || '',
    contact_phone: user?.phone || '',
    
    // Información del vuelo
    flight_number: '',
    flight_type: '' as 'nacional' | 'internacional' | '',
    
    // Fecha y hora del servicio
    service_date: '',
    pickup_time: '',
    
    // Ubicaciones
    pickup_location: '',
    dropoff_location: '',
    
    // Información del viaje (para referencia)
    origin: '',
    destination: '',
    
    // Pasajeros
    passenger_count: 1,
    passenger_names: [''],
    
    // Equipaje
    luggage_hand: 0,
    luggage_checked: 0,
    
    // Servicios y requerimientos
    additional_services: '',
    special_requirements: '',
    
    // Datos técnicos del viaje
    estimated_duration: 60,
    service_type_id: '',
    vehicle_category: 'sedan_ejecutivo' as const,
    includes_tolls: true,
    includes_parking: true,
    gps_tracking: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (user && user.role === 'client') {
      dispatch(fetchServiceTypes());
      dispatch(fetchVehicleCategories());
    }
  }, [dispatch, user]);

  // Actualizar formulario cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        requester_name: user.full_name || '',
        requester_email: user.email || '',
        contact_phone: user.phone || ''
      }));
    }
  }, [user]);

  // Actualizar número de pasajeros cuando cambie la categoría del vehículo
  useEffect(() => {
    if (formData.vehicle_category && vehicleCategories.length > 0) {
      const selectedVehicleCategory = vehicleCategories.find(vc => vc.code === formData.vehicle_category);
      if (selectedVehicleCategory) {
        setFormData(prev => ({ 
          ...prev, 
          passenger_count: Math.min(prev.passenger_count, selectedVehicleCategory.max_passengers)
        }));
      }
    }
  }, [formData.vehicle_category, vehicleCategories]);

  // Actualizar array de nombres de pasajeros cuando cambie el número
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      passenger_names: Array.from({ length: prev.passenger_count }, (_, i) => prev.passenger_names[i] || '')
    }));
  }, [formData.passenger_count]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePassengerNameChange = (index: number, value: string) => {
    const newNames = [...formData.passenger_names];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, passenger_names: newNames }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Información del solicitante
    if (!formData.requester_name.trim()) newErrors.requester_name = 'El nombre del solicitante es requerido';
    if (!formData.requester_email.trim()) newErrors.requester_email = 'El correo electrónico es requerido';
    if (!formData.contact_phone.trim()) newErrors.contact_phone = 'El teléfono de contacto es requerido';
    
    // Fecha y hora del servicio
    if (!formData.service_date) newErrors.service_date = 'La fecha del servicio es requerida';
    if (!formData.pickup_time) newErrors.pickup_time = 'La hora de recogida es requerida';
    
    // Ubicaciones
    if (!formData.pickup_location.trim()) newErrors.pickup_location = 'La dirección de recogida es requerida';
    if (!formData.dropoff_location.trim()) newErrors.dropoff_location = 'La dirección de destino es requerida';
    
    // Información del viaje
    if (!formData.origin.trim()) newErrors.origin = 'El origen es requerido';
    if (!formData.destination.trim()) newErrors.destination = 'El destino es requerido';
    if (!formData.service_type_id) newErrors.service_type_id = 'El tipo de servicio es requerido';
    
    // Pasajeros
    if (formData.passenger_count <= 0) newErrors.passenger_count = 'El número de pasajeros debe ser mayor a 0';
    
    // Validar nombres de pasajeros
    const validNames = formData.passenger_names.filter(name => name.trim() !== '');
    if (validNames.length === 0) {
      newErrors.passenger_names = 'Debe ingresar al menos un nombre de pasajero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Obtener precio base del tipo de servicio
      const selectedServiceType = serviceTypes.find(st => st.id === formData.service_type_id);
      const basePrice = selectedServiceType?.base_price || 0;
      
      // Calcular precio total estimado
      const estimatedPrice = basePrice * formData.passenger_count;

      // Crear la solicitud de viaje
      const requestData = {
        user_id: user.id,
        trip_id: null, // No hay trip_id hasta que se apruebe
        
        // Información básica de la reserva
        passenger_count: formData.passenger_count,
        passenger_names: formData.passenger_names.filter(name => name.trim() !== ''),
        total_price: estimatedPrice,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        special_requirements: formData.special_requirements,
        contact_phone: formData.contact_phone,
        flight_number: formData.flight_number || undefined,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        
        // Nuevos campos detallados
        company_name: formData.company_name || undefined,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        flight_type: formData.flight_type || undefined,
        service_date: formData.service_date,
        pickup_time: formData.pickup_time,
        luggage_hand: formData.luggage_hand,
        luggage_checked: formData.luggage_checked,
        additional_services: formData.additional_services || undefined,
        
        // Datos del viaje solicitado (para crear el trip cuando se apruebe)
        trip_request_origin: formData.origin,
        trip_request_destination: formData.destination,
        trip_request_departure_time: `${formData.service_date}T${formData.pickup_time}:00.000Z`,
        trip_request_estimated_duration: formData.estimated_duration,
        trip_request_service_type_id: formData.service_type_id,
        trip_request_vehicle_category: formData.vehicle_category,
        trip_request_includes_tolls: formData.includes_tolls,
        trip_request_includes_parking: formData.includes_parking,
        trip_request_gps_tracking: formData.gps_tracking,
      };

      await dispatch(createReservation(requestData)).unwrap();

      setToast({
        message: '¡Solicitud de viaje enviada exitosamente! Te contactaremos pronto para confirmar los detalles.',
        type: 'success'
      });
      
      // Redirigir a las reservas del cliente después de un breve delay
      setTimeout(() => {
        router.push('/dashboard/client/reservations');
      }, 2000);

    } catch (error: any) {
      setToast({
        message: error.message || 'Error al enviar la solicitud. Por favor intenta nuevamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxPassengers = () => {
    if (formData.vehicle_category && vehicleCategories.length > 0) {
      const selectedVehicleCategory = vehicleCategories.find(vc => vc.code === formData.vehicle_category);
      return selectedVehicleCategory?.max_passengers || 1;
    }
    return 1;
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/client')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Volver</span>
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Solicitar Viaje</h1>
                    <p className="text-xs text-gray-500">Transportes Torres - Cliente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Solicitud de Servicio de Transporte</h2>
              <p className="text-sm text-gray-500 mt-1">
                Completa todos los campos para solicitar tu viaje. Nos pondremos en contacto contigo para confirmar los detalles.
              </p>
            </div>

            <form onSubmit={onSubmit} className="p-6">
              {/* Información del Solicitante */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre de la empresa */}
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                      <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                      Nombre Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  {/* Nombre completo */}
                  <div>
                    <label htmlFor="requester_name" className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Nombre Completo del Solicitante *
                    </label>
                    <input
                      type="text"
                      id="requester_name"
                      name="requester_name"
                      value={formData.requester_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Tu nombre completo"
                    />
                    {errors.requester_name && (
                      <p className="text-red-600 text-sm mt-1">{errors.requester_name}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.contact_phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.contact_phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="requester_email" className="block text-sm font-medium text-gray-700 mb-2">
                      <MailIcon className="h-4 w-4 inline mr-1" />
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="requester_email"
                      name="requester_email"
                      value={formData.requester_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="tu@email.com"
                    />
                    {errors.requester_email && (
                      <p className="text-red-600 text-sm mt-1">{errors.requester_email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Vuelo */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ✈️ Información del Vuelo (si aplica)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número de vuelo */}
                  <div>
                    <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Nº de vuelo
                    </label>
                    <input
                      type="text"
                      id="flight_number"
                      name="flight_number"
                      value={formData.flight_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Ej: LA800"
                    />
                  </div>

                  {/* Tipo de vuelo */}
                  <div>
                    <label htmlFor="flight_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de vuelo
                    </label>
                    <select
                      id="flight_type"
                      name="flight_type"
                      value={formData.flight_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="nacional">🔘 Nacional</option>
                      <option value="internacional">🔘 Internacional</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fecha y Hora del Servicio */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Fecha y Hora del Servicio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fecha del servicio */}
                  <div>
                    <label htmlFor="service_date" className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Fecha del Servicio *
                    </label>
                    <input
                      type="date"
                      id="service_date"
                      name="service_date"
                      value={formData.service_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                    {errors.service_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.service_date}</p>
                    )}
                  </div>

                  {/* Hora de recogida */}
                  <div>
                    <label htmlFor="pickup_time" className="block text-sm font-medium text-gray-700 mb-2">
                      🕒 Hora de Recogida *
                    </label>
                    <input
                      type="time"
                      id="pickup_time"
                      name="pickup_time"
                      value={formData.pickup_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                    {errors.pickup_time && (
                      <p className="text-red-600 text-sm mt-1">{errors.pickup_time}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ubicaciones */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Ubicaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dirección de recogida */}
                  <div>
                    <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-2">
                      🏠 Dirección de Recogida *
                    </label>
                    <input
                      type="text"
                      id="pickup_location"
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Dirección exacta donde te recogeremos"
                    />
                    {errors.pickup_location && (
                      <p className="text-red-600 text-sm mt-1">{errors.pickup_location}</p>
                    )}
                  </div>

                  {/* Dirección de destino */}
                  <div>
                    <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Dirección de Destino *
                    </label>
                    <input
                      type="text"
                      id="dropoff_location"
                      name="dropoff_location"
                      value={formData.dropoff_location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Dirección exacta de destino"
                    />
                    {errors.dropoff_location && (
                      <p className="text-red-600 text-sm mt-1">{errors.dropoff_location}</p>
                    )}
                  </div>

                  {/* Origen (referencia) */}
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
                      Origen (referencia) *
                    </label>
                    <input
                      type="text"
                      id="origin"
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Ej: Aeropuerto, Hotel, etc."
                    />
                    {errors.origin && (
                      <p className="text-red-600 text-sm mt-1">{errors.origin}</p>
                    )}
                  </div>

                  {/* Destino (referencia) */}
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                      Destino (referencia) *
                    </label>
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Ej: Las Condes, Providencia, etc."
                    />
                    {errors.destination && (
                      <p className="text-red-600 text-sm mt-1">{errors.destination}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pasajeros */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Pasajeros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Número de pasajeros */}
                  <div>
                    <label htmlFor="passenger_count" className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Pasajeros *
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4].map(num => (
                        <label key={num} className="flex items-center">
                          <input
                            type="radio"
                            name="passenger_count"
                            value={num}
                            checked={formData.passenger_count === num}
                            onChange={(e) => setFormData(prev => ({ ...prev, passenger_count: Number(e.target.value) }))}
                            className="mr-1"
                          />
                          🔘 {num}
                        </label>
                      ))}
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="passenger_count"
                          value="other"
                          checked={formData.passenger_count > 4}
                          onChange={() => setFormData(prev => ({ ...prev, passenger_count: 5 }))}
                          className="mr-1"
                        />
                        🔘 Otro:
                        {formData.passenger_count > 4 && (
                          <input
                            type="number"
                            value={formData.passenger_count}
                            onChange={(e) => setFormData(prev => ({ ...prev, passenger_count: Number(e.target.value) }))}
                            min="5"
                            max={getMaxPassengers()}
                            className="ml-1 w-16 px-2 py-1 border border-gray-300 rounded"
                          />
                        )}
                      </label>
                    </div>
                    {errors.passenger_count && (
                      <p className="text-red-600 text-sm mt-1">{errors.passenger_count}</p>
                    )}
                  </div>

                  {/* Tipo de servicio */}
                  <div>
                    <label htmlFor="service_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Servicio *
                    </label>
                    <select
                      id="service_type_id"
                      name="service_type_id"
                      value={formData.service_type_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="">Seleccionar tipo de servicio</option>
                      {serviceTypes.map((serviceType) => (
                        <option key={serviceType.id} value={serviceType.id}>
                          {serviceType.name} - ${serviceType.base_price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {errors.service_type_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.service_type_id}</p>
                    )}
                  </div>
                </div>

                {/* Nombres de pasajeros */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres de Pasajeros *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.passenger_names.map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        value={name}
                        onChange={(e) => handlePassengerNameChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder={`Nombre del pasajero ${index + 1}`}
                      />
                    ))}
                  </div>
                  {errors.passenger_names && (
                    <p className="text-red-600 text-sm mt-1">{errors.passenger_names}</p>
                  )}
                </div>
              </div>

              {/* Equipaje */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🧳 Cantidad de Maletas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Maletas de mano */}
                  <div>
                    <label htmlFor="luggage_hand" className="block text-sm font-medium text-gray-700 mb-2">
                      De mano Nº
                    </label>
                    <input
                      type="number"
                      id="luggage_hand"
                      name="luggage_hand"
                      value={formData.luggage_hand}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Maletas sobre 23 kilos */}
                  <div>
                    <label htmlFor="luggage_checked" className="block text-sm font-medium text-gray-700 mb-2">
                      Sobre 23 kilos Nº
                    </label>
                    <input
                      type="number"
                      id="luggage_checked"
                      name="luggage_checked"
                      value={formData.luggage_checked}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Servicios Adicionales */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ⚙️ Servicios Adicionales
                </h3>
                
                {/* Servicios adicionales requeridos */}
                <div className="mb-4">
                  <label htmlFor="additional_services" className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Requiere algún servicio adicional? (especificar)
                  </label>
                  <textarea
                    id="additional_services"
                    name="additional_services"
                    value={formData.additional_services}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Describe cualquier servicio adicional que necesites..."
                  />
                </div>

                {/* Requerimientos especiales */}
                <div className="mb-4">
                  <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Requerimientos Especiales
                  </label>
                  <textarea
                    id="special_requirements"
                    name="special_requirements"
                    value={formData.special_requirements}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Cualquier requerimiento especial o información adicional"
                  />
                </div>

                {/* Servicios incluidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Servicios Incluidos
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="includes_tolls"
                        checked={formData.includes_tolls}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Incluir Peajes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="includes_parking"
                        checked={formData.includes_parking}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Incluir Estacionamiento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="gps_tracking"
                        checked={formData.gps_tracking}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Seguimiento GPS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/client')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Solicitar Viaje</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

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