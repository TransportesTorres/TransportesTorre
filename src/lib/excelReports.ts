import * as XLSX from 'xlsx';

interface ReportData {
  reservations: any[];
  trips: any[];
  drivers: any[];
}

export const generateDetailedReport = (data: ReportData) => {
  const { reservations, trips, drivers } = data;
  
  // Debug eliminado para producción
  
  // Crear un nuevo workbook
  const workbook = XLSX.utils.book_new();

  // === HOJA 1: RESERVAS ===
  const reservationsData = reservations.map((reservation, index) => {
    // Buscar el trip asociado a esta reserva
    const associatedTrip = trips.find(trip => trip.id === reservation.trip_id);
    
    // Buscar el conductor asociado al trip
    // Los trips vienen con el objeto driver incluido desde Supabase
    const associatedDriver = associatedTrip?.driver || null;

    // Formatear información del vehículo
    const vehicleInfo = associatedDriver?.vehicle_info 
      ? (typeof associatedDriver.vehicle_info === 'object' 
         ? `${associatedDriver.vehicle_info.brand} ${associatedDriver.vehicle_info.model} ${associatedDriver.vehicle_info.year} - ${associatedDriver.vehicle_info.plate}`
         : associatedDriver.vehicle_info)
      : 'N/A';

    return {
      'N°': index + 1,
      'ID Reserva': reservation.id,
      'Código': reservation.confirmation_code || 'N/A',
      'Cliente': reservation.profiles?.full_name || reservation.requester_name || 'N/A',
      'Email': reservation.profiles?.email || reservation.requester_email || 'N/A',
      'Teléfono': reservation.contact_phone || 'N/A',
      'Empresa': reservation.company_name || 'N/A',
      'Fecha Solicitud': reservation.created_at ? new Date(reservation.created_at).toLocaleDateString('es-CL') : 'N/A',
      'Fecha Viaje': reservation.service_date ? new Date(reservation.service_date).toLocaleDateString('es-CL') : 'N/A',
      'Hora': reservation.pickup_time || 'N/A',
      'Origen': reservation.pickup_location || 'Por definir',
      'Destino': reservation.dropoff_location || 'Por definir',
      'Pasajeros': reservation.passenger_count || 0,
      'Equipaje de Mano': reservation.luggage_hand || 0,
      'Bodega': reservation.luggage_checked || 0,
      'Vuelo': reservation.flight_number || 'N/A',
      'Tipo Vuelo': reservation.flight_type || 'N/A',
      'Estado': reservation.status === 'pending' ? 'Pendiente' : 
                reservation.status === 'confirmed' ? 'Confirmado' : 
                reservation.status === 'assign_driver' ? 'Esperando Conductor' :
                reservation.status === 'rejected' ? 'Rechazado' :
                reservation.status === 'completed' ? 'Completado' : reservation.status,
      'Conductor Asignado': associatedDriver?.full_name || 'No asignado',
      'Teléfono Conductor': associatedDriver?.phone || 'N/A',
      'Email Conductor': associatedDriver?.email || 'N/A',
      'Vehículo': vehicleInfo,
      'Requerimientos Especiales': reservation.special_requirements || 'Ninguno',
      'Servicios Adicionales': reservation.additional_services || 'Ninguno'
    };
  });

  const reservationsSheet = XLSX.utils.json_to_sheet(reservationsData);
  
  // Ajustar ancho de columnas para reservas
  const reservationsColWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // ID Reserva
    { wch: 12 },  // Código
    { wch: 20 },  // Cliente
    { wch: 25 },  // Email
    { wch: 15 },  // Teléfono
    { wch: 20 },  // Empresa
    { wch: 12 },  // Fecha Solicitud
    { wch: 12 },  // Fecha Viaje
    { wch: 8 },   // Hora
    { wch: 25 },  // Origen
    { wch: 25 },  // Destino
    { wch: 10 },  // Pasajeros
    { wch: 12 },  // Equipaje de Mano
    { wch: 10 },  // Bodega
    { wch: 12 },  // Vuelo
    { wch: 12 },  // Tipo Vuelo
    { wch: 15 },  // Estado
    { wch: 20 },  // Conductor Asignado
    { wch: 15 },  // Teléfono Conductor
    { wch: 25 },  // Email Conductor
    { wch: 30 },  // Vehículo
    { wch: 25 },  // Requerimientos Especiales
    { wch: 25 }   // Servicios Adicionales
  ];
  reservationsSheet['!cols'] = reservationsColWidths;
  
  XLSX.utils.book_append_sheet(workbook, reservationsSheet, 'Reservas');

  // === HOJA 2: VIAJES ===
  const tripsData = trips.map((trip, index) => {
    // Buscar la reserva asociada a este viaje
    const associatedReservation = reservations.find(reservation => reservation.trip_id === trip.id);
    
    // Buscar el conductor asociado al viaje
    // Los trips vienen con el objeto driver incluido desde Supabase
    const associatedDriver = trip.driver || null;

    // Formatear información del vehículo
    const vehicleInfo = associatedDriver?.vehicle_info 
      ? (typeof associatedDriver.vehicle_info === 'object' 
         ? `${associatedDriver.vehicle_info.brand} ${associatedDriver.vehicle_info.model} ${associatedDriver.vehicle_info.year} - ${associatedDriver.vehicle_info.plate}`
         : associatedDriver.vehicle_info)
      : 'N/A';

    return {
      'N°': index + 1,
      'ID Viaje': trip.id,
      'Código Reserva': associatedReservation?.confirmation_code || 'N/A',
      'Fecha': trip.departure_time ? new Date(trip.departure_time).toLocaleDateString('es-CL') : 'N/A',
      'Hora': trip.departure_time ? new Date(trip.departure_time).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      'Cliente': associatedReservation?.profiles?.full_name || associatedReservation?.requester_name || 'N/A',
      'Teléfono Cliente': associatedReservation?.contact_phone || 'N/A',
      'Origen': trip.origin || associatedReservation?.pickup_location || 'Por definir',
      'Destino': trip.destination || associatedReservation?.dropoff_location || 'Por definir',
      'Conductor': associatedDriver?.full_name || 'No asignado',
      'Teléfono Conductor': associatedDriver?.phone || 'N/A',
      'Email Conductor': associatedDriver?.email || 'N/A',
      'Licencia': associatedDriver?.license_number || 'N/A',
      'Vehículo': vehicleInfo,
      'Pasajeros': trip.max_passengers || associatedReservation?.passenger_count || 0,
      'Duración Estimada': trip.estimated_duration ? `${trip.estimated_duration} min` : 'N/A',
      'Estado Viaje': trip.status === 'available' ? 'Disponible' :
                      trip.status === 'booked' ? 'Reservado' : 
                      trip.status === 'assign_driver' ? 'Esperando Conductor' :
                      trip.status === 'completed' ? 'Completado' : 
                      trip.status === 'cancelled' ? 'Cancelado' : trip.status,
      'Incluye Peajes': trip.includes_tolls ? 'Sí' : 'No',
      'Incluye Parking': trip.includes_parking ? 'Sí' : 'No',
      'GPS Tracking': trip.gps_tracking ? 'Sí' : 'No',
      'Instrucciones': trip.special_instructions || associatedReservation?.special_requirements || 'Ninguna'
    };
  });

  const tripsSheet = XLSX.utils.json_to_sheet(tripsData);
  
  // Ajustar ancho de columnas para viajes
  const tripsColWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // ID Viaje
    { wch: 12 },  // Código Reserva
    { wch: 12 },  // Fecha
    { wch: 8 },   // Hora
    { wch: 20 },  // Cliente
    { wch: 15 },  // Teléfono Cliente
    { wch: 25 },  // Origen
    { wch: 25 },  // Destino
    { wch: 20 },  // Conductor
    { wch: 15 },  // Teléfono Conductor
    { wch: 25 },  // Email Conductor
    { wch: 15 },  // Licencia
    { wch: 30 },  // Vehículo
    { wch: 10 },  // Pasajeros
    { wch: 12 },  // Duración Estimada
    { wch: 15 },  // Estado Viaje
    { wch: 12 },  // Incluye Peajes
    { wch: 12 },  // Incluye Parking
    { wch: 12 },  // GPS Tracking
    { wch: 30 }   // Instrucciones
  ];
  tripsSheet['!cols'] = tripsColWidths;
  
  XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Viajes');

  // === HOJA 3: CONDUCTORES ===
  const driversData = drivers.map((driver, index) => ({
    'N°': index + 1,
    'ID': driver.id,
    'Nombre Completo': driver.full_name || 'N/A',
    'Email': driver.email || 'N/A',
    'Teléfono': driver.phone || 'N/A',
    'Número de Licencia': driver.license_number || 'N/A',
    'Información del Vehículo': driver.vehicle_info || 'N/A',
    'Estado': driver.is_active ? 'Activo' : 'Inactivo',
    'Fecha Registro': driver.created_at ? new Date(driver.created_at).toLocaleDateString('es-CL') : 'N/A',
    'Última Actualización': driver.updated_at ? new Date(driver.updated_at).toLocaleDateString('es-CL') : 'N/A'
  }));

  const driversSheet = XLSX.utils.json_to_sheet(driversData);
  
  // Ajustar ancho de columnas para conductores
  const driversColWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // ID
    { wch: 25 },  // Nombre Completo
    { wch: 25 },  // Email
    { wch: 15 },  // Teléfono
    { wch: 18 },  // Número de Licencia
    { wch: 30 },  // Información del Vehículo
    { wch: 10 },  // Estado
    { wch: 15 },  // Fecha Registro
    { wch: 18 }   // Última Actualización
  ];
  driversSheet['!cols'] = driversColWidths;
  
  XLSX.utils.book_append_sheet(workbook, driversSheet, 'Conductores');

  return workbook;
};

export const downloadExcelReport = (data: ReportData) => {
  try {
    const workbook = generateDetailedReport(data);
    
    // Generar el archivo y descargarlo
    const date = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    const filename = `Reporte_Transportes_Torres_${date}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    throw new Error('Error al generar el reporte Excel');
  }
};

export const generateQuickStats = (reservations: any[]) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  
  return {
    total: reservations.length,
    thisMonth: reservations.filter(r => new Date(r.created_at) >= startOfMonth).length,
    thisWeek: reservations.filter(r => new Date(r.created_at) >= startOfWeek).length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length
  };
}; 
