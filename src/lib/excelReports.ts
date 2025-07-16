import * as XLSX from 'xlsx';

interface ReportData {
  reservations: any[];
  trips: any[];
  drivers: any[];
}

export const generateDetailedReport = (data: ReportData) => {
  const { reservations, trips, drivers } = data;
  
  // Crear un nuevo workbook
  const workbook = XLSX.utils.book_new();

  // === HOJA 1: RESERVAS ===
  const reservationsData = reservations.map((reservation, index) => ({
    'N°': index + 1,
    'ID Reserva': reservation.id,
    'Cliente': reservation.profiles?.full_name || reservation.requester_name || 'N/A',
    'Email': reservation.profiles?.email || 'N/A',
    'Teléfono': reservation.contact_phone || 'N/A',
    'Fecha Solicitud': reservation.created_at ? new Date(reservation.created_at).toLocaleDateString('es-CL') : 'N/A',
    'Fecha Viaje': reservation.trip_date ? new Date(reservation.trip_date).toLocaleDateString('es-CL') : 'N/A',
    'Hora': reservation.trip_time || 'N/A',
    'Origen': reservation.pickup_location || 'Por definir',
    'Destino': reservation.dropoff_location || 'Por definir',
    'Pasajeros': reservation.passenger_count || 0,
    'Equipaje de Mano': reservation.hand_luggage_count || 0,
    'Bodega': reservation.luggage_count || 0,
    'Estado': reservation.status === 'pending' ? 'Pendiente' : 
              reservation.status === 'confirmed' ? 'Confirmado' : 
              reservation.status === 'rejected' ? 'Rechazado' :
              reservation.status === 'completed' ? 'Completado' : reservation.status,
    'Conductor Asignado': reservation.trips?.drivers?.full_name || 'No asignado',
    'Teléfono Conductor': reservation.trips?.drivers?.phone || 'N/A',
    'Vehículo': reservation.trips?.drivers?.vehicle_info || 'N/A',
    'Notas': reservation.notes || 'Sin notas',
    'Tipo Servicio': reservation.service_types?.name || 'Por definir'
  }));

  const reservationsSheet = XLSX.utils.json_to_sheet(reservationsData);
  
  // Ajustar ancho de columnas para reservas
  const reservationsColWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // ID Reserva
    { wch: 20 },  // Cliente
    { wch: 25 },  // Email
    { wch: 15 },  // Teléfono
    { wch: 12 },  // Fecha Solicitud
    { wch: 12 },  // Fecha Viaje
    { wch: 8 },   // Hora
    { wch: 25 },  // Origen
    { wch: 25 },  // Destino
    { wch: 10 },  // Pasajeros
    { wch: 12 },  // Equipaje de Mano
    { wch: 10 },  // Bodega
    { wch: 12 },  // Estado
    { wch: 20 },  // Conductor Asignado
    { wch: 15 },  // Teléfono Conductor
    { wch: 20 },  // Vehículo
    { wch: 30 },  // Notas
    { wch: 15 }   // Tipo Servicio
  ];
  reservationsSheet['!cols'] = reservationsColWidths;
  
  XLSX.utils.book_append_sheet(workbook, reservationsSheet, 'Reservas');

  // === HOJA 2: VIAJES ===
  const tripsData = trips.map((trip, index) => ({
    'N°': index + 1,
    'ID Viaje': trip.id,
    'Fecha': trip.trip_date ? new Date(trip.trip_date).toLocaleDateString('es-CL') : 'N/A',
    'Hora': trip.trip_time || 'N/A',
    'Cliente': trip.reservations?.profiles?.full_name || trip.reservations?.requester_name || 'N/A',
    'Teléfono Cliente': trip.reservations?.contact_phone || 'N/A',
    'Origen': trip.reservations?.pickup_location || 'Por definir',
    'Destino': trip.reservations?.dropoff_location || 'Por definir',
    'Conductor': trip.drivers?.full_name || 'No asignado',
    'Teléfono Conductor': trip.drivers?.phone || 'N/A',
    'Email Conductor': trip.drivers?.email || 'N/A',
    'Licencia': trip.drivers?.license_number || 'N/A',
    'Vehículo': trip.drivers?.vehicle_info || 'N/A',
    'Pasajeros': trip.reservations?.passenger_count || 0,
    'Estado Viaje': trip.status === 'pending' ? 'Pendiente' : 
                    trip.status === 'confirmed' ? 'Confirmado' : 
                    trip.status === 'in_progress' ? 'En Progreso' :
                    trip.status === 'completed' ? 'Completado' : trip.status,
    'Notas': trip.notes || trip.reservations?.notes || 'Sin notas'
  }));

  const tripsSheet = XLSX.utils.json_to_sheet(tripsData);
  
  // Ajustar ancho de columnas para viajes
  const tripsColWidths = [
    { wch: 5 },   // N°
    { wch: 12 },  // ID Viaje
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
    { wch: 20 },  // Vehículo
    { wch: 10 },  // Pasajeros
    { wch: 12 },  // Estado Viaje
    { wch: 30 }   // Notas
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
    completed: reservations.filter(r => r.status === 'completed').length,
    totalRevenue: reservations.reduce((sum, r) => sum + (r.total_price || 0), 0),
    averageRevenue: reservations.length > 0 ? 
      reservations.reduce((sum, r) => sum + (r.total_price || 0), 0) / reservations.length : 0
  };
}; 