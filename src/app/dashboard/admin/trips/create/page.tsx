'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { createTrip, fetchServiceTypes, fetchDrivers, fetchVehicleCategories } from '@/store/slices/tripsSlice';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';

// Iconos SVG personalizados
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

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

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

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function CreateTripPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { 
    serviceTypes, 
    drivers, 
    vehicleCategories,
    isLoading,
    error 
  } = useAppSelector((state) => state.trips);

  // Estados del formulario
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: undefined as string | undefined,
    estimated_duration: 60,
    service_type_id: '',
    max_passengers: 1,
    driver_id: '',
    vehicle_category: 'sedan_ejecutivo' as const,
    special_instructions: undefined as string | undefined,
    includes_tolls: true,
    includes_parking: true,
    gps_tracking: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    // Cargar datos necesarios para el formulario
    dispatch(fetchServiceTypes());
    dispatch(fetchDrivers());
    dispatch(fetchVehicleCategories());
  }, [dispatch]);

  // Actualizar pasajeros máximos cuando cambie la categoría del vehículo
  useEffect(() => {
    if (formData.vehicle_category && vehicleCategories.length > 0) {
      const selectedVehicleCategory = vehicleCategories.find(vc => vc.code === formData.vehicle_category);
      if (selectedVehicleCategory) {
        setFormData(prev => ({ ...prev, max_passengers: selectedVehicleCategory.max_passengers }));
      }
    }
  }, [formData.vehicle_category, vehicleCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      // Para campos opcionales, usar undefined si está vacío
      const finalValue = (name === 'arrival_time' || name === 'special_instructions') 
        ? (value.trim() === '' ? undefined : value)
        : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin.trim()) newErrors.origin = 'El origen es requerido';
    if (!formData.destination.trim()) newErrors.destination = 'El destino es requerido';
    if (!formData.departure_time) newErrors.departure_time = 'La fecha y hora de salida es requerida';
    if (formData.estimated_duration <= 0) newErrors.estimated_duration = 'La duración debe ser mayor a 0';
    if (!formData.service_type_id) newErrors.service_type_id = 'El tipo de servicio es requerido';
    if (!formData.driver_id) newErrors.driver_id = 'El conductor es requerido';
    if (formData.max_passengers <= 0) newErrors.max_passengers = 'El número de pasajeros debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Limpiar datos antes de enviar - convertir strings vacíos a undefined para campos opcionales
      const cleanedData = {
        ...formData,
        arrival_time: formData.arrival_time?.trim() || undefined,
        special_instructions: formData.special_instructions?.trim() || undefined,
      };

      await dispatch(createTrip(cleanedData)).unwrap();
      setToastMessage('¡Viaje creado exitosamente!');
      setToastType('success');
      setShowToast(true);
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push('/dashboard/admin');
      }, 2000);
    } catch (error: any) {
      setToastMessage(error.message || 'Error al crear el viaje');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/admin');
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Volver</span>
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <TruckIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Crear Nuevo Viaje</h1>
                    <p className="text-xs text-gray-500">Transportes Torres - Admin</p>
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
              <h2 className="text-xl font-semibold text-gray-900">Información del Viaje</h2>
              <p className="text-sm text-gray-500 mt-1">
                Completa todos los campos necesarios para crear un nuevo viaje
              </p>
            </div>

            <form onSubmit={onSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Origen */}
                <div>
                  <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Origen
                  </label>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Ej: Aeropuerto Arturo Merino Benítez"
                  />
                  {errors.origin && (
                    <p className="text-red-600 text-sm mt-1">{errors.origin}</p>
                  )}
                </div>

                {/* Destino */}
                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Destino
                  </label>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Ej: Las Condes, Santiago"
                  />
                  {errors.destination && (
                    <p className="text-red-600 text-sm mt-1">{errors.destination}</p>
                  )}
                </div>

                {/* Hora de salida */}
                <div>
                  <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Fecha y Hora de Salida
                  </label>
                  <input
                    type="datetime-local"
                    id="departure_time"
                    name="departure_time"
                    value={formData.departure_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  {errors.departure_time && (
                    <p className="text-red-600 text-sm mt-1">{errors.departure_time}</p>
                  )}
                </div>

                {/* Hora de llegada (opcional) */}
                <div>
                  <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Fecha y Hora de Llegada (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    id="arrival_time"
                    name="arrival_time"
                    value={formData.arrival_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Duración estimada */}
                <div>
                  <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-2">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Duración Estimada (minutos)
                  </label>
                  <input
                    type="number"
                    id="estimated_duration"
                    name="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="60"
                  />
                  {errors.estimated_duration && (
                    <p className="text-red-600 text-sm mt-1">{errors.estimated_duration}</p>
                  )}
                </div>

                {/* Tipo de servicio */}
                <div>
                  <label htmlFor="service_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Servicio
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

                {/* Conductor */}
                <div>
                  <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Conductor
                  </label>
                  <select
                    id="driver_id"
                    name="driver_id"
                    value={formData.driver_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">Seleccionar conductor</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} - {driver.vehicle_info.brand} {driver.vehicle_info.model}
                      </option>
                    ))}
                  </select>
                  {errors.driver_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.driver_id}</p>
                  )}
                </div>

                {/* Categoría de vehículo */}
                <div>
                  <label htmlFor="vehicle_category" className="block text-sm font-medium text-gray-700 mb-2">
                    <TruckIcon className="h-4 w-4 inline mr-1" />
                    Categoría del Vehículo
                  </label>
                  <select
                    id="vehicle_category"
                    name="vehicle_category"
                    value={formData.vehicle_category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    {vehicleCategories.map((category) => (
                      <option key={category.id} value={category.code}>
                        {category.name} - Max {category.max_passengers} pasajeros
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_category && (
                    <p className="text-red-600 text-sm mt-1">{errors.vehicle_category}</p>
                  )}
                </div>

                {/* Pasajeros máximos */}
                <div>
                  <label htmlFor="max_passengers" className="block text-sm font-medium text-gray-700 mb-2">
                    Pasajeros Máximos
                  </label>
                  <input
                    type="number"
                    id="max_passengers"
                    name="max_passengers"
                    value={formData.max_passengers}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="4"
                  />
                  {errors.max_passengers && (
                    <p className="text-red-600 text-sm mt-1">{errors.max_passengers}</p>
                  )}
                </div>

                {/* Instrucciones especiales */}
                <div className="md:col-span-2">
                  <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones Especiales
                  </label>
                  <textarea
                    id="special_instructions"
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Información adicional sobre el viaje (opcional)"
                  />
                </div>

                {/* Opciones adicionales */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Opciones del Viaje
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includes_tolls"
                        name="includes_tolls"
                        checked={formData.includes_tolls}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="includes_tolls" className="ml-2 text-sm text-gray-700">
                        Incluye peajes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includes_parking"
                        name="includes_parking"
                        checked={formData.includes_parking}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="includes_parking" className="ml-2 text-sm text-gray-700">
                        Incluye estacionamiento
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="gps_tracking"
                        name="gps_tracking"
                        checked={formData.gps_tracking}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="gps_tracking" className="ml-2 text-sm text-gray-700">
                        Seguimiento GPS
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
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
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Crear Viaje</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Toast de notificaciones */}
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      </div>
    </ProtectedRoute>
  );
} 