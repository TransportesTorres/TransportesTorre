'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchReservations, 
  updateReservationStatus,
  confirmReservation,
  assignDriverToReservation
} from '@/store/slices/reservationsSlice';
import { fetchTrips, completeTrip, cancelTrip } from '@/store/slices/tripsSlice';
import { fetchDrivers, createDriver, updateDriver, deleteDriver, deactivateDriver, activateDriver } from '@/store/slices/driversSlice';
import { logoutUser } from '@/store/slices/authSlice';
import { downloadExcelReport } from '@/lib/excelReports';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Toast from '@/components/ui/Toast';
import { supabase } from '@/supabase/supabase';

// Icons
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

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
  </svg>
);

type ViewMode = 'dashboard' | 'confirmed-trips' | 'active-trips' | 'completed-trips' | 'drivers';

const AdminDashboard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { reservations } = useAppSelector((state) => state.reservations);
  const { trips } = useAppSelector((state) => state.trips);
  const { drivers } = useAppSelector((state) => state.drivers);
  const { user } = useAppSelector((state) => state.auth);

  // Estados principales
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados para el formulario de conductor
  const [driverForm, setDriverForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_type: 'B',
    experience_years: 1,
    vehicle_info: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      color: '',
      category: 'sedan_ejecutivo',
      max_passengers: 4,
      has_gps: true,
      insurance_per_seat: true,
      kilometers: 0
    },
    is_active: true
  });

  useEffect(() => {
    dispatch(fetchReservations({}));
    dispatch(fetchTrips({ all: true }));
    dispatch(fetchDrivers({ includeInactive: true })); // Incluir conductores inactivos para gestión completa
  }, [dispatch]);

  // Debug function para verificar estados de viajes
  useEffect(() => {
    console.log('🔍 Debug - Trips loaded:', trips.length);
    console.log('🔍 Debug - Trip statuses:', trips.map(t => ({ 
      id: t.id, 
      status: t.status, 
      departure_time: t.departure_time,
      origin: t.origin,
      destination: t.destination
    })));
    
    const statusCounts = trips.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🔍 Debug - Status counts:', statusCounts);
    
    // Debug específico para viajes completados
    const completedTripsDebug = trips.filter(t => t.status === 'completed');
    console.log('🔍 Debug - Completed trips details:', completedTripsDebug.map(t => ({
      id: t.id,
      status: t.status,
      origin: t.origin,
      destination: t.destination,
      hasReservation: !!t.reservations,
      reservationData: t.reservations,
      driver: t.driver?.full_name
    })));
  }, [trips]);

  // Calcular estadísticas
  const pendingRequests = reservations.filter(reservation => 
    (reservation.status === 'pending' || reservation.status === 'assign_driver')
  );

  const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
  const activeTrips = trips.filter(t => t.status === 'booked' || t.status === 'confirmed');
  const completedTrips = trips.filter(t => t.status === 'completed');
  const availableDrivers = drivers.filter(d => d.is_active);

  // Calcular estadísticas de hoy
  const today = new Date().toISOString().split('T')[0];
  const confirmedToday = confirmedReservations.filter(r => 
    r.updated_at && r.updated_at.startsWith(today)
  ).length;

  // Filtrar datos según el término de búsqueda
  const filteredPendingRequests = pendingRequests.filter(request =>
    request.confirmation_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConfirmedTrips = trips.filter(trip =>
    trip.status === 'confirmed' && (
      trip.reservations?.confirmation_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.reservations?.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredActiveTrips = activeTrips.filter(trip =>
    trip.reservations?.confirmation_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.reservations?.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedTrips = completedTrips.filter(trip => {
    // Si no hay término de búsqueda, mostrar todos los viajes completados
    if (!searchTerm) return true;
    
    // Si hay término de búsqueda, buscar en los datos disponibles
    const searchLower = searchTerm.toLowerCase();
    
    // Obtener la primera reserva del array
    const reservation = Array.isArray(trip.reservations) ? trip.reservations[0] : trip.reservations;
    
    // Buscar en datos de reserva si existen
    const reservationMatch = reservation && (
      reservation.confirmation_code?.toLowerCase().includes(searchLower) ||
      reservation.requester_name?.toLowerCase().includes(searchLower) ||
      reservation.profiles?.full_name?.toLowerCase().includes(searchLower)
    );
    
    // Buscar en datos del viaje
    const tripMatch = 
      trip.origin?.toLowerCase().includes(searchLower) ||
      trip.destination?.toLowerCase().includes(searchLower) ||
      trip.id.toLowerCase().includes(searchLower);
    
    // Buscar en datos del conductor
    const driverMatch = trip.driver && (
      trip.driver.full_name?.toLowerCase().includes(searchLower) ||
      trip.driver.phone?.toLowerCase().includes(searchLower)
    );
    
    return reservationMatch || tripMatch || driverMatch;
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logs para entender el problema (movidos después de definir todas las variables)
  console.log('🔍 Debug - Total trips:', trips.length);
  console.log('🔍 Debug - Trip statuses:', trips.map(t => ({ id: t.id, status: t.status })));
  console.log('🔍 Debug - Completed trips count:', completedTrips.length);
  console.log('🔍 Debug - Completed trips:', completedTrips);
  console.log('🔍 Debug - Filtered completed trips count:', filteredCompletedTrips.length);
  console.log('🔍 Debug - Search term:', searchTerm);
  console.log('🔍 Debug - View mode:', viewMode);
  
  // Debug específico para viajes completados y sus reservas
  completedTrips.forEach((trip, index) => {
    console.log(`🔍 Debug - Trip ${index + 1}:`, {
      id: trip.id,
      status: trip.status,
      origin: trip.origin,
      destination: trip.destination,
      hasReservation: !!trip.reservations,
      reservationData: trip.reservations,
      driver: trip.driver?.full_name,
      departure_time: trip.departure_time
    });
  });

  // Función de prueba para completar un viaje
  const handleTestCompleteTrip = async () => {
    const confirmedTrips = trips.filter(t => t.status === 'confirmed');
    if (confirmedTrips.length === 0) {
      setToast({
        message: 'No hay viajes confirmados para completar',
        type: 'error'
      });
      return;
    }
    
    const testTrip = confirmedTrips[0];
    console.log('🧪 Completando viaje de prueba:', testTrip.id);
    
    try {
      await dispatch(completeTrip(testTrip.id));
      setToast({
        message: 'Viaje completado exitosamente. Revisa la sección de viajes completados.',
        type: 'success'
      });
      // Recargar datos
      dispatch(fetchTrips({ all: true }));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al completar viaje',
        type: 'error'
      });
    }
  };

  // Función para manejar logout
  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try {
        await dispatch(logoutUser());
        window.location.href = '/auth?mode=login';
      } catch (error: any) {
        setToast({
          message: error.message || 'Error al cerrar sesión',
          type: 'error'
        });
      }
    }
  };

  // Función para descargar reporte
  const handleDownloadReport = async () => {
    try {
      setToast({
        message: 'Generando reporte de Excel...',
        type: 'info'
      });

      const reportData = {
        reservations: reservations,
        trips: trips,
        drivers: drivers
      };

      downloadExcelReport(reportData);

      setToast({
        message: 'Reporte descargado exitosamente',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al generar el reporte',
        type: 'error'
      });
    }
  };

  // Funciones para confirmar y asignar conductor
  const handleConfirmRequest = async (request: any) => {
    setIsProcessing(true);
    try {
      await dispatch(confirmReservation({ reservationId: request.id }));
      setToast({
        message: 'Solicitud confirmada. Cliente notificado.',
        type: 'success'
      });
      dispatch(fetchReservations({}));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al confirmar solicitud',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId || !selectedRequest) return;

    setIsProcessing(true);
    try {
      await dispatch(assignDriverToReservation({
        reservationId: selectedRequest.id,
        driverId: selectedDriverId
      }));
      
      setToast({
        message: 'Conductor asignado exitosamente',
        type: 'success'
      });
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setSelectedDriverId('');
      dispatch(fetchReservations({}));
      dispatch(fetchTrips({ all: true }));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al asignar conductor',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para completar viaje
  const handleCompleteTrip = async (trip: any) => {
    if (window.confirm(`¿Confirmar que el viaje ${trip.reservations?.confirmation_code || trip.id} ha sido completado?`)) {
      setIsProcessing(true);
      try {
        await dispatch(completeTrip(trip.id));
        setToast({
          message: 'Viaje completado exitosamente',
          type: 'success'
        });
        dispatch(fetchTrips({ all: true }));
        dispatch(fetchReservations({}));
      } catch (error: any) {
        setToast({
          message: error.message || 'Error al completar viaje',
          type: 'error'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Función para cancelar viaje
  const handleCancelTrip = async (trip: any) => {
    if (window.confirm(`¿Confirmar que deseas cancelar el viaje ${trip.reservations?.confirmation_code || trip.id}?`)) {
      setIsProcessing(true);
      try {
        await dispatch(cancelTrip(trip.id));
        setToast({
          message: 'Viaje cancelado exitosamente',
          type: 'success'
        });
        dispatch(fetchTrips({ all: true }));
        dispatch(fetchReservations({}));
      } catch (error: any) {
        setToast({
          message: error.message || 'Error al cancelar viaje',
          type: 'error'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Función para verificar estado de admin
  const handleVerifyAdmin = async () => {
    console.log('👤 Verificando estado de admin...');
    try {
      const result = await dispatch(verifyAdminStatus());
      console.log('📋 Resultado verificación admin:', result);
      
      if (verifyAdminStatus.fulfilled.match(result)) {
        const { isAdmin, profile } = result.payload;
        setToast({
          message: `Usuario: ${profile?.full_name || 'N/A'} - Role: ${profile?.role || 'N/A'} - Admin: ${isAdmin ? 'SÍ' : 'NO'}`,
          type: isAdmin ? 'success' : 'error'
        });
      } else {
        setToast({
          message: 'Error al verificar estado de admin',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      setToast({
        message: 'Error al verificar estado de admin',
        type: 'error'
      });
    }
  };

  // Función de prueba para verificar acceso a drivers
  const handleTestDriversAccess = async () => {
    console.log('🧪 Probando acceso a tabla drivers...');
    try {
      const result = await dispatch(testDriversAccess());
      console.log('📋 Resultado de prueba:', result);
      
      if (testDriversAccess.fulfilled.match(result)) {
        setToast({
          message: 'Prueba de acceso exitosa. Revisa la consola para detalles.',
          type: 'success'
        });
      } else {
        setToast({
          message: 'Error en prueba de acceso. Revisa la consola.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      setToast({
        message: 'Error al realizar prueba de acceso',
        type: 'error'
      });
    }
  };

  // Funciones para gestionar conductores
  const handleSaveDriver = async () => {
    setIsProcessing(true);
    try {
      if (selectedDriver?.id) {
        // Editar conductor existente
        console.log('🔧 Editando conductor:', {
          id: selectedDriver.id,
          formData: driverForm
        });
        
        const result = await dispatch(updateDriver({ id: selectedDriver.id, data: driverForm }));
        
        console.log('📋 Resultado de actualización:', result);
        
        // Verificar si la acción fue rechazada
        if (updateDriver.rejected.match(result)) {
          console.error('❌ Error en actualización:', result.payload);
          throw new Error(result.payload as string);
        }
        
        setToast({
          message: 'Conductor actualizado exitosamente',
          type: 'success'
        });
      } else {
        // Crear nuevo conductor
        console.log('➕ Creando nuevo conductor:', driverForm);
        
        const result = await dispatch(createDriver(driverForm));
        
        // Verificar si la acción fue rechazada
        if (createDriver.rejected.match(result)) {
          throw new Error(result.payload as string);
        }
        
        setToast({
          message: 'Conductor creado exitosamente',
          type: 'success'
        });
      }
      
      setShowDriverModal(false);
      setSelectedDriver(null);
      resetDriverForm();
      dispatch(fetchDrivers({ includeInactive: true }));
    } catch (error: any) {
      console.error('Error in handleSaveDriver:', error);
      setToast({
        message: error.message || 'Error al guardar conductor',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (window.confirm('⚠️ ADVERTENCIA: Esta acción eliminará permanentemente al conductor de la base de datos. Esta acción no se puede deshacer. ¿Estás completamente seguro?')) {
      if (window.confirm('¿Confirmas que quieres eliminar permanentemente este conductor?')) {
        setIsProcessing(true);
        try {
          await dispatch(deleteDriver(driverId));
          setToast({
            message: 'Conductor eliminado permanentemente',
            type: 'success'
          });
          dispatch(fetchDrivers({ includeInactive: true }));
        } catch (error: any) {
          setToast({
            message: error.message || 'Error al eliminar conductor',
            type: 'error'
          });
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const resetDriverForm = () => {
    setDriverForm({
      full_name: '',
      email: '',
      phone: '',
      license_number: '',
      license_type: 'B',
      experience_years: 1,
      vehicle_info: {
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        color: '',
        category: 'sedan_ejecutivo',
        max_passengers: 4,
        has_gps: true,
        insurance_per_seat: true,
        kilometers: 0
      },
      is_active: true
    });
  };

  const openDriverModal = (driver?: any) => {
    if (driver) {
      setSelectedDriver(driver);
      setDriverForm({
        ...driver,
        vehicle_info: typeof driver.vehicle_info === 'string' 
          ? JSON.parse(driver.vehicle_info) 
          : driver.vehicle_info
      });
    } else {
      setSelectedDriver(null);
      resetDriverForm();
    }
    setShowDriverModal(true);
  };

  // Función para recargar datos
  const reloadData = () => {
    console.log('🔄 Recargando datos...');
    dispatch(fetchReservations({}));
    dispatch(fetchTrips({ all: true }));
    dispatch(fetchDrivers({ includeInactive: true }));
  };

  // Función para manejar clics en las cards
  const handleCardClick = (mode: ViewMode) => {
    console.log('🖱️ Card clicked:', mode);
    setViewMode(mode);
    
    // Recargar datos cuando se entra a viajes completados
    if (mode === 'completed-trips') {
      reloadDataWithReservations();
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'No especificada';
    try {
      // Si ya es una hora (HH:MM:SS), la usamos directamente
      if (timeString.includes(':') && timeString.length <= 8) {
        return timeString.substring(0, 5); // HH:MM
      }
      // Si es una fecha completa, extraemos la hora
      return new Date(timeString).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Hora inválida';
    }
  };

  // Función para buscar reservas asociadas a viajes completados
  const fetchReservationForTrip = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          profiles(
            id,
            email,
            full_name,
            phone,
            role
          )
        `)
        .eq('trip_id', tripId)
        .single();
      
      if (error) {
        console.log('❌ Error buscando reserva para trip:', tripId, error);
        return null;
      }
      
      console.log('✅ Reserva encontrada para trip:', tripId, data);
      return data;
    } catch (error) {
      console.log('❌ Error general buscando reserva:', error);
      return null;
    }
  };

  // Función para recargar datos con reservas
  const reloadDataWithReservations = async () => {
    console.log('🔄 Recargando datos con reservas...');
    dispatch(fetchReservations({}));
    dispatch(fetchTrips({ all: true }));
    dispatch(fetchDrivers({ includeInactive: true }));
    
    // Buscar reservas para viajes completados sin datos de reserva
    setTimeout(async () => {
      const completedTripsWithoutReservations = trips.filter(t => 
        t.status === 'completed' && !t.reservations
      );
      
      console.log('🔍 Viajes completados sin reservas:', completedTripsWithoutReservations.length);
      
      for (const trip of completedTripsWithoutReservations) {
        const reservation = await fetchReservationForTrip(trip.id);
        if (reservation) {
          console.log('✅ Reserva encontrada para viaje:', trip.id, reservation);
        }
      }
    }, 1000);
  };

  // Funciones para gestión de conductores
  const handleDeactivateDriver = async (driverId: string) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar este conductor? El conductor no podrá ser asignado a nuevos viajes.')) {
      setIsProcessing(true);
      try {
        await dispatch(deactivateDriver(driverId));
        setToast({
          message: 'Conductor desactivado exitosamente',
          type: 'success'
        });
        dispatch(fetchDrivers({ includeInactive: true }));
      } catch (error: any) {
        setToast({
          message: error.message || 'Error al desactivar conductor',
          type: 'error'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleActivateDriver = async (driverId: string) => {
    setIsProcessing(true);
    try {
      await dispatch(activateDriver(driverId));
      setToast({
        message: 'Conductor activado exitosamente',
        type: 'success'
      });
      dispatch(fetchDrivers({ includeInactive: true }));
    } catch (error: any) {
      setToast({
        message: error.message || 'Error al activar conductor',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderizar contenido según el modo de vista
  const renderContent = () => {
    if (viewMode === 'dashboard') {
      return (
        <>
          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              onClick={() => handleCardClick('dashboard')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gestión de Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('confirmed-trips')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmadas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{confirmedToday}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('active-trips')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <TruckIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Viajes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{activeTrips.length}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('completed-trips')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <HistoryIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Viajes Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{completedTrips.length}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleCardClick('drivers')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conductores Disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{availableDrivers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reportes */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Reportes y Exportación</h2>
                <p className="text-gray-600">Descarga reportes detallados con toda la información del sistema</p>
              </div>
              <div className="flex flex-col items-end">
                <button
                  onClick={handleDownloadReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reporte Completo Excel
                </button>
                <div className="text-sm text-gray-500 mt-2 text-right">
                  • Todas las reservas<br/>
                  • Estadísticas mensuales<br/>
                  • Información de conductores
                </div>
              </div>
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Solicitudes de Viaje Pendientes</h2>
              <p className="text-gray-600">Revisa y aprueba las solicitudes de transporte de los clientes</p>
            </div>

            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes pendientes</h3>
                  <p className="mt-1 text-sm text-gray-500">Todas las solicitudes han sido procesadas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen/Destino</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.requester_name}</div>
                              <div className="text-sm text-gray-500">{request.confirmation_code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div>📍 {request.pickup_location || 'Por definir'}</div>
                              <div>🎯 {request.dropoff_location || 'Por definir'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>{formatDate(request.service_date)}</div>
                              <div>{formatTime(request.pickup_time)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {request.status === 'pending' ? 'Pendiente' : 'Esperando Conductor'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              
                              {request.status === 'pending' ? (
                                <button
                                  onClick={() => handleConfirmRequest(request)}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                                >
                                  Confirmar
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApprovalModal(true);
                                  }}
                                  disabled={isProcessing}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                                >
                                  Asignar Chofer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    if (viewMode === 'confirmed-trips') {
      return (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Viajes Confirmados</h2>
                <p className="text-gray-600">Gestiona los viajes que han sido confirmados</p>
              </div>
              <button
                onClick={() => setViewMode('dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver al Dashboard
              </button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mt-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código de reserva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredConfirmedTrips.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes confirmados</h3>
                <p className="mt-1 text-sm text-gray-500">Los viajes confirmados aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConfirmedTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trip.reservations?.confirmation_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.reservations?.requester_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.reservations?.contact_phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.driver?.full_name || 'No asignado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.driver?.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div>📍 {trip.origin || trip.reservations?.pickup_location || 'N/A'}</div>
                            <div>🎯 {trip.destination || trip.reservations?.dropoff_location || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{formatDate(trip.departure_time || trip.reservations?.service_date)}</div>
                            <div>{formatTime(trip.departure_time || trip.reservations?.pickup_time)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTrip(trip);
                                setShowTripModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCompleteTrip(trip)}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                              title="Completar viaje"
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip)}
                              disabled={isProcessing}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                              title="Cancelar viaje"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (viewMode === 'active-trips') {
      return (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Viajes Activos</h2>
                <p className="text-gray-600">Monitorea los viajes en curso</p>
              </div>
              <button
                onClick={() => setViewMode('dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver al Dashboard
              </button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mt-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código de reserva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredActiveTrips.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes activos</h3>
                <p className="mt-1 text-sm text-gray-500">Los viajes activos aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveTrips.map((trip) => (
                  <div key={trip.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {trip.reservations?.confirmation_code || trip.id.slice(0, 8)}
                        </h3>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {trip.status === 'booked' ? 'Reservado' : 'Confirmado'}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowTripModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Cliente:</p>
                        <p className="text-sm text-gray-900">{trip.reservations?.requester_name || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Conductor:</p>
                        <p className="text-sm text-gray-900">{trip.driver?.full_name || 'No asignado'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Ruta:</p>
                        <p className="text-sm text-gray-900">
                          📍 {trip.origin || trip.reservations?.pickup_location || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-900">
                          🎯 {trip.destination || trip.reservations?.dropoff_location || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fecha/Hora:</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(trip.departure_time || trip.reservations?.service_date)} - {formatTime(trip.departure_time || trip.reservations?.pickup_time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                      <button
                        onClick={() => handleCompleteTrip(trip)}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => handleCancelTrip(trip)}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (viewMode === 'completed-trips') {
      return (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Viajes Completados</h2>
                <p className="text-gray-600">Revisa los viajes que han finalizado</p>
              </div>
              <button
                onClick={() => setViewMode('dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver al Dashboard
              </button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mt-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código de reserva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredCompletedTrips.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {completedTrips.length === 0 ? 'No hay viajes completados' : 'No se encontraron resultados'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {completedTrips.length === 0 
                    ? 'Los viajes completados aparecerán aquí.' 
                    : 'Intenta con otro término de búsqueda.'}
                </p>
                
                {/* Botón de prueba para completar un viaje */}
                {completedTrips.length === 0 && trips.filter(t => t.status === 'confirmed').length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={handleTestCompleteTrip}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🧪 Completar Viaje de Prueba
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Haz clic para completar un viaje confirmado y ver cómo funciona
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompletedTrips.map((trip) => {
                      // Obtener la primera reserva del array
                      const reservation = Array.isArray(trip.reservations) ? trip.reservations[0] : trip.reservations;
                      
                      return (
                        <tr key={trip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation?.confirmation_code || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {reservation?.requester_name || reservation?.profiles?.full_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {reservation?.contact_phone || reservation?.profiles?.phone || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {trip.driver?.full_name || 'No asignado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {trip.driver?.phone || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div>📍 {trip.origin || reservation?.pickup_location || 'N/A'}</div>
                              <div>🎯 {trip.destination || reservation?.dropoff_location || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>{formatDate(trip.departure_time || reservation?.service_date)}</div>
                              <div>{formatTime(trip.departure_time || reservation?.pickup_time)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Completado
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedTrip(trip);
                                  setShowTripModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalles"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (viewMode === 'drivers') {
      return (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestión de Conductores</h2>
                <p className="text-gray-600">Administra los conductores del sistema</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openDriverModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Conductor
                </button>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border"
                >
                  ← Volver al Dashboard
                </button>
              </div>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mt-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conductor por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay conductores</h3>
                <p className="mt-1 text-sm text-gray-500">Agrega conductores para gestionar el equipo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.map((driver) => {
                      const vehicleInfo = typeof driver.vehicle_info === 'string' 
                        ? JSON.parse(driver.vehicle_info || '{}') 
                        : driver.vehicle_info || {};
                      
                      return (
                        <tr key={driver.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{driver.full_name}</div>
                              <div className="text-sm text-gray-500">{driver.experience_years} años experiencia</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{driver.email}</div>
                              <div className="text-sm text-gray-500">{driver.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{driver.license_number}</div>
                              <div className="text-sm text-gray-500">Tipo {driver.license_type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {vehicleInfo.brand} {vehicleInfo.model} {vehicleInfo.year}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicleInfo.plate} - {vehicleInfo.max_passengers} pasajeros
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              driver.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {driver.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openDriverModal(driver)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar conductor"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              
                              {/* Botón Activar/Desactivar */}
                              {driver.is_active ? (
                                <button
                                  onClick={() => handleDeactivateDriver(driver.id)}
                                  disabled={isProcessing}
                                  className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                  title="Desactivar conductor"
                                >
                                  <EyeOffIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateDriver(driver.id)}
                                  disabled={isProcessing}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  title="Activar conductor"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              )}
                              
                              {/* Botón Eliminar Permanente */}
                              <button
                                onClick={() => handleDeleteDriver(driver.id)}
                                disabled={isProcessing}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                title="Eliminar conductor permanentemente"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Bienvenido, {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {renderContent()}
          </div>
        </div>

        {/* Modal para asignar conductor */}
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Asignar Conductor - {selectedRequest.confirmation_code}
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selecciona un conductor disponible para este viaje:
                  </p>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar conductor...</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleAssignDriver}
                    disabled={!selectedDriverId || isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Asignando...' : 'Asignar Conductor'}
                  </button>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedRequest(null);
                      setSelectedDriverId('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para detalles de viaje */}
        {showTripModal && selectedTrip && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Detalles del Viaje - {(() => {
                      const reservation = Array.isArray(selectedTrip.reservations) ? selectedTrip.reservations[0] : selectedTrip.reservations;
                      return reservation?.confirmation_code || selectedTrip.id.slice(0, 8);
                    })()}
                  </h3>
                  <button
                    onClick={() => {
                      setShowTripModal(false);
                      setSelectedTrip(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {(() => {
                  // Obtener la primera reserva del array
                  const reservation = Array.isArray(selectedTrip.reservations) ? selectedTrip.reservations[0] : selectedTrip.reservations;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Información del Cliente</h4>
                        <p><strong>Nombre:</strong> {reservation?.requester_name || reservation?.profiles?.full_name || 'N/A'}</p>
                        <p><strong>Email:</strong> {reservation?.requester_email || reservation?.profiles?.email || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {reservation?.contact_phone || reservation?.profiles?.phone || 'N/A'}</p>
                        <p><strong>Empresa:</strong> {reservation?.company_name || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Información del Conductor</h4>
                        <p><strong>Nombre:</strong> {selectedTrip.driver?.full_name || 'No asignado'}</p>
                        <p><strong>Teléfono:</strong> {selectedTrip.driver?.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedTrip.driver?.email || 'N/A'}</p>
                        <p><strong>Licencia:</strong> {selectedTrip.driver?.license_number || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Detalles del Viaje</h4>
                        <p><strong>Origen:</strong> {selectedTrip.origin || reservation?.pickup_location || 'N/A'}</p>
                        <p><strong>Destino:</strong> {selectedTrip.destination || reservation?.dropoff_location || 'N/A'}</p>
                        <p><strong>Fecha:</strong> {formatDate(selectedTrip.departure_time || reservation?.service_date)}</p>
                        <p><strong>Hora:</strong> {formatTime(selectedTrip.departure_time || reservation?.pickup_time)}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Información Adicional</h4>
                        <p><strong>Pasajeros:</strong> {selectedTrip.max_passengers || reservation?.passenger_count || 'N/A'}</p>
                        <p><strong>Vuelo:</strong> {reservation?.flight_number || 'N/A'}</p>
                        <p><strong>Equipaje:</strong> {(reservation?.luggage_hand || 0) + (reservation?.luggage_checked || 0)} piezas</p>
                        <p><strong>Estado:</strong> 
                          <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                            selectedTrip.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedTrip.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedTrip.status === 'completed' ? '✅ Completado' : 
                             selectedTrip.status === 'cancelled' ? '❌ Cancelado' : 
                             selectedTrip.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
                
                {(() => {
                  const reservation = Array.isArray(selectedTrip.reservations) ? selectedTrip.reservations[0] : selectedTrip.reservations;
                  return reservation?.special_requirements && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Requerimientos Especiales</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {reservation.special_requirements}
                      </p>
                    </div>
                  );
                })()}
                
                {/* Mostrar botones de acción solo si el viaje NO está completado */}
                {selectedTrip.status !== 'completed' && (
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={() => {
                        handleCompleteTrip(selectedTrip);
                        setShowTripModal(false);
                      }}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      Completar Viaje
                    </button>
                    <button
                      onClick={() => {
                        handleCancelTrip(selectedTrip);
                        setShowTripModal(false);
                      }}
                      disabled={isProcessing}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      Cancelar Viaje
                    </button>
                  </div>
                )}
                
                {/* Mostrar mensaje para viajes completados */}
                {selectedTrip.status === 'completed' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-green-800 font-medium">
                        Este viaje ya ha sido completado. No se pueden realizar más acciones.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para conductor */}
        {showDriverModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedDriver ? 'Editar Conductor' : 'Nuevo Conductor'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDriverModal(false);
                      setSelectedDriver(null);
                      resetDriverForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveDriver(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información Personal */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-700">Información Personal</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.full_name}
                          onChange={(e) => setDriverForm({...driverForm, full_name: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={driverForm.email}
                          onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.phone}
                          onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Licencia *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.license_number}
                          onChange={(e) => setDriverForm({...driverForm, license_number: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Licencia
                        </label>
                        <select
                          value={driverForm.license_type}
                          onChange={(e) => setDriverForm({...driverForm, license_type: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="B">Clase B</option>
                          <option value="A-1">Clase A-1</option>
                          <option value="A-2">Clase A-2</option>
                          <option value="A-3">Clase A-3</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Años de Experiencia
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={driverForm.experience_years}
                          onChange={(e) => setDriverForm({...driverForm, experience_years: parseInt(e.target.value)})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={driverForm.is_active}
                            onChange={(e) => setDriverForm({...driverForm, is_active: e.target.checked})}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Conductor Activo</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Información del Vehículo */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-700">Información del Vehículo</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marca *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.vehicle_info.brand}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, brand: e.target.value}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Modelo *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.vehicle_info.model}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, model: e.target.value}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Año *
                        </label>
                        <input
                          type="number"
                          required
                          min="1990"
                          max={new Date().getFullYear() + 1}
                          value={driverForm.vehicle_info.year}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, year: parseInt(e.target.value)}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Patente *
                        </label>
                        <input
                          type="text"
                          required
                          value={driverForm.vehicle_info.plate}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, plate: e.target.value.toUpperCase()}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={driverForm.vehicle_info.color}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, color: e.target.value}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría
                        </label>
                        <select
                          value={driverForm.vehicle_info.category}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, category: e.target.value}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="sedan_ejecutivo">Sedán Ejecutivo</option>
                          <option value="suv_ejecutiva">SUV Ejecutiva</option>
                          <option value="van_ejecutiva">Van Ejecutiva</option>
                          <option value="minibus">Minibús</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Máximo Pasajeros
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={driverForm.vehicle_info.max_passengers}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, max_passengers: parseInt(e.target.value)}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kilómetros
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={driverForm.vehicle_info.kilometers}
                          onChange={(e) => setDriverForm({
                            ...driverForm, 
                            vehicle_info: {...driverForm.vehicle_info, kilometers: parseInt(e.target.value)}
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={driverForm.vehicle_info.has_gps}
                            onChange={(e) => setDriverForm({
                              ...driverForm, 
                              vehicle_info: {...driverForm.vehicle_info, has_gps: e.target.checked}
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Tiene GPS</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={driverForm.vehicle_info.insurance_per_seat}
                            onChange={(e) => setDriverForm({
                              ...driverForm, 
                              vehicle_info: {...driverForm.vehicle_info, insurance_per_seat: e.target.checked}
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Seguro por asiento</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDriverModal(false);
                        setSelectedDriver(null);
                        resetDriverForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {isProcessing ? 'Guardando...' : 'Guardar Conductor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para detalles de solicitud */}
        {selectedRequest && !showApprovalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Detalles de la Solicitud - {selectedRequest.confirmation_code}
                  </h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Información del Cliente</h4>
                    <p><strong>Nombre:</strong> {selectedRequest.requester_name}</p>
                    <p><strong>Email:</strong> {selectedRequest.requester_email}</p>
                    <p><strong>Teléfono:</strong> {selectedRequest.contact_phone}</p>
                    <p><strong>Empresa:</strong> {selectedRequest.company_name || 'No especificada'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Detalles del Viaje</h4>
                    <p><strong>Origen:</strong> {selectedRequest.pickup_location}</p>
                    {selectedRequest.trip_request_origin !== selectedRequest.pickup_location && selectedRequest.trip_request_origin !== 'Por definir' && (
                      <p className="text-gray-500 text-xs ml-4">inicial (referencia): {selectedRequest.trip_request_origin}</p>
                    )}
                    <p><strong>Destino:</strong> {selectedRequest.dropoff_location}</p>
                    {selectedRequest.trip_request_destination !== selectedRequest.dropoff_location && selectedRequest.trip_request_destination !== 'Por definir' && (
                      <p className="text-gray-500 text-xs ml-4">inicial (referencia): {selectedRequest.trip_request_destination}</p>
                    )}
                    <p><strong>Fecha:</strong> {formatDate(selectedRequest.service_date)}</p>
                    <p><strong>Hora:</strong> {formatTime(selectedRequest.pickup_time)}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Información del Vuelo</h4>
                    <p><strong>Número de Vuelo:</strong> {selectedRequest.flight_number || 'No especificado'}</p>
                    <p><strong>Tipo:</strong> {selectedRequest.flight_type || 'No especificado'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Pasajeros y Equipaje</h4>
                    <p><strong>Pasajeros:</strong> {selectedRequest.passenger_count}</p>
                    <p><strong>Equipaje de mano:</strong> {selectedRequest.luggage_hand || 0}</p>
                    <p><strong>Equipaje bodega:</strong> {selectedRequest.luggage_checked || 0}</p>
                  </div>
                </div>
                
                {selectedRequest.special_requirements && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Requerimientos Especiales</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedRequest.special_requirements}
                    </p>
                  </div>
                )}
                
                {selectedRequest.additional_services && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Servicios Adicionales</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedRequest.additional_services}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard; 