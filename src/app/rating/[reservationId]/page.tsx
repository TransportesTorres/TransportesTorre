'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/supabase';

interface RatingData {
  overall_rating: number;
  punctuality_rating: number;
  vehicle_condition_rating: number;
  driver_service_rating: number;
  comment: string;
  would_recommend: boolean;
}

interface ReservationData {
  id: string;
  confirmation_code: string;
  pickup_location: string;
  dropoff_location: string;
  service_date: string;
  pickup_time: string;
  driver?: {
    full_name: string;
    vehicle_info: any;
  };
  user_id: string;
  trip_id: string;
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={`text-3xl transition-colors ${
              star <= (hoverValue || value)
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {value === 0 && 'Sin calificación'}
        {value === 1 && 'Muy malo'}
        {value === 2 && 'Malo'}
        {value === 3 && 'Regular'}
        {value === 4 && 'Bueno'}
        {value === 5 && 'Excelente'}
      </p>
    </div>
  );
};

export default function RatingPage({ params }: { params: { reservationId: string } }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ratingData, setRatingData] = useState<RatingData>({
    overall_rating: 0,
    punctuality_rating: 0,
    vehicle_condition_rating: 0,
    driver_service_rating: 0,
    comment: '',
    would_recommend: true,
  });

  useEffect(() => {
    loadReservation();
  }, [params.reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      
      // Verificar si ya existe un rating para esta reserva
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('reservation_id', params.reservationId)
        .single();
      
      if (existingRating) {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Obtener información de la reserva
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          confirmation_code,
          pickup_location,
          dropoff_location,
          service_date,
          pickup_time,
          user_id,
          trip_id,
          status,
          trips!inner(
            id,
            status,
            driver:drivers(
              full_name,
              vehicle_info
            )
          )
        `)
        .eq('id', params.reservationId)
        .eq('status', 'completed')
        .single();

      if (error) {
        console.error('Error loading reservation:', error);
        setError('No se encontró la reserva o no está completada');
        return;
      }

      if (!data) {
        setError('Reserva no encontrada');
        return;
      }

      setReservation({
        ...data,
        driver: data.trips?.driver
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservation) return;
    
    // Validar que todas las calificaciones estén completas
    if (
      ratingData.overall_rating === 0 ||
      ratingData.punctuality_rating === 0 ||
      ratingData.vehicle_condition_rating === 0 ||
      ratingData.driver_service_rating === 0
    ) {
      setError('Por favor completa todas las calificaciones');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Obtener driver_id del trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('driver_id')
        .eq('id', reservation.trip_id)
        .single();

      if (tripError || !tripData?.driver_id) {
        throw new Error('No se pudo obtener información del conductor');
      }

      const { error } = await supabase
        .from('ratings')
        .insert([{
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          driver_id: tripData.driver_id,
          overall_rating: ratingData.overall_rating,
          punctuality_rating: ratingData.punctuality_rating,
          vehicle_condition_rating: ratingData.vehicle_condition_rating,
          driver_service_rating: ratingData.driver_service_rating,
          comment: ratingData.comment.trim() || null,
          would_recommend: ratingData.would_recommend,
        }]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setError(err.message || 'Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Gracias por tu calificación!</h1>
          <p className="text-gray-600 mb-6">
            Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se encontró la reserva</p>
        </div>
      </div>
    );
  }

  const vehicleInfo = reservation.driver?.vehicle_info;
  const vehicleDisplay = vehicleInfo 
    ? (typeof vehicleInfo === 'object' 
       ? `${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}`
       : vehicleInfo)
    : 'Información no disponible';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🌟 Califica tu viaje
            </h1>
            <p className="text-gray-600">
              Tu opinión nos ayuda a mejorar nuestro servicio
            </p>
          </div>

          {/* Información del viaje */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Viaje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Código:</strong> {reservation.confirmation_code}</p>
                <p><strong>Fecha:</strong> {new Date(reservation.service_date).toLocaleDateString('es-CL')}</p>
                <p><strong>Hora:</strong> {reservation.pickup_time}</p>
              </div>
              <div>
                <p><strong>Conductor:</strong> {reservation.driver?.full_name || 'No disponible'}</p>
                <p><strong>Vehículo:</strong> {vehicleDisplay}</p>
              </div>
            </div>
            <div className="mt-4">
              <p><strong>Ruta:</strong> {reservation.pickup_location} → {reservation.dropoff_location}</p>
            </div>
          </div>

          {/* Formulario de calificación */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating
              label="⭐ Calificación General"
              value={ratingData.overall_rating}
              onChange={(rating) => setRatingData({ ...ratingData, overall_rating: rating })}
            />

            <StarRating
              label="⏰ Puntualidad"
              value={ratingData.punctuality_rating}
              onChange={(rating) => setRatingData({ ...ratingData, punctuality_rating: rating })}
            />

            <StarRating
              label="🚗 Condición del Vehículo"
              value={ratingData.vehicle_condition_rating}
              onChange={(rating) => setRatingData({ ...ratingData, vehicle_condition_rating: rating })}
            />

            <StarRating
              label="👨‍💼 Servicio del Conductor"
              value={ratingData.driver_service_rating}
              onChange={(rating) => setRatingData({ ...ratingData, driver_service_rating: rating })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Comentarios (opcional)
              </label>
              <textarea
                value={ratingData.comment}
                onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Cuéntanos sobre tu experiencia..."
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ratingData.would_recommend}
                  onChange={(e) => setRatingData({ ...ratingData, would_recommend: e.target.checked })}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  👍 ¿Recomendarías nuestro servicio?
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : '✨ Enviar Calificación'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 Transportes Torres SpA - Gracias por elegirnos
          </p>
        </div>
      </div>
    </div>
  );
} 