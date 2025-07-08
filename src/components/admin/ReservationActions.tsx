import React, { useState } from 'react';
import { useAppDispatch } from '@/store';
import { updateReservation } from '@/store/slices/reservationsSlice';
import { 
  sendAutomaticEmails, 
  sendReservationConfirmedEmail,
  verifyEmailConfiguration 
} from '@/lib/emailHelpers';

interface ReservationActionsProps {
  reservation: {
    id: string;
    confirmation_code: string;
    status: string;
    profiles: {
      email: string;
      full_name: string;
    };
    trips?: {
      drivers?: {
        email: string;
        full_name: string;
      };
    };
  };
  onStatusChange: () => void;
}

export default function ReservationActions({ 
  reservation, 
  onStatusChange 
}: ReservationActionsProps) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string>('');

  // Confirmar reserva y enviar correos
  const handleConfirmReservation = async () => {
    setIsLoading(true);
    setEmailStatus('Confirmando reserva...');
    
    try {
      // 1. Actualizar estado en base de datos
      await dispatch(updateReservation({
        id: reservation.id,
        updates: { status: 'confirmed' }
      })).unwrap();
      
      setEmailStatus('Enviando correos...');
      
      // 2. Enviar correos automáticamente
      const emailResult = await sendAutomaticEmails(
        reservation.id,
        reservation.profiles.email,
        'confirmed',
        reservation.trips?.drivers?.email
      );
      
      if (emailResult.success) {
        setEmailStatus('✅ Reserva confirmada y correos enviados');
        onStatusChange();
      } else {
        setEmailStatus('⚠️ Reserva confirmada pero algunos correos fallaron');
        console.error('Email errors:', emailResult.results);
      }
    } catch (error) {
      setEmailStatus('❌ Error al confirmar reserva');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar correo de confirmación
  const handleResendConfirmation = async () => {
    setIsLoading(true);
    setEmailStatus('Reenviando correo...');
    
    try {
      const result = await sendReservationConfirmedEmail(
        reservation.id,
        reservation.profiles.email
      );
      
      if (result.success) {
        setEmailStatus('✅ Correo reenviado exitosamente');
      } else {
        setEmailStatus('❌ Error al reenviar correo');
      }
    } catch (error) {
      setEmailStatus('❌ Error al reenviar correo');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar configuración de correo
  const handleVerifyEmailConfig = async () => {
    setIsLoading(true);
    setEmailStatus('Verificando configuración...');
    
    try {
      const result = await verifyEmailConfiguration();
      
      if (result.connected) {
        setEmailStatus('✅ Configuración de correo válida');
      } else {
        setEmailStatus('❌ Error en configuración de correo');
      }
    } catch (error) {
      setEmailStatus('❌ Error al verificar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        🎫 Reserva {reservation.confirmation_code}
      </h3>
      
      <div className="space-y-4">
        {/* Información básica */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p><strong>Cliente:</strong> {reservation.profiles.full_name}</p>
          <p><strong>Email:</strong> {reservation.profiles.email}</p>
          <p><strong>Estado:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              reservation.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {reservation.status}
            </span>
          </p>
          {reservation.trips?.drivers && (
            <p><strong>Conductor:</strong> {reservation.trips.drivers.full_name}</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          {reservation.status === 'pending' && (
            <button
              onClick={handleConfirmReservation}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Confirmando...' : '✅ Confirmar y Enviar Correos'}
            </button>
          )}
          
          {reservation.status === 'confirmed' && (
            <button
              onClick={handleResendConfirmation}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : '📧 Reenviar Confirmación'}
            </button>
          )}
          
          <button
            onClick={handleVerifyEmailConfig}
            disabled={isLoading}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : '🔧 Verificar Email Config'}
          </button>
        </div>

        {/* Estado del correo */}
        {emailStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            emailStatus.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : emailStatus.includes('❌') 
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {emailStatus}
          </div>
        )}
      </div>
    </div>
  );
} 