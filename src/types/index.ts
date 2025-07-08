export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  license_number: string;
  license_type: 'A-2' | 'A-3' | 'A-4' | 'A-5'; // Tipos de licencia específicos
  experience_years: number;
  vehicle_info: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    category: 'sedan_ejecutivo' | 'sedan_lujo' | 'minivan_ejecutiva' | 'minivan_lujo' | 'suv_ejecutiva' | 'sprinter';
    max_passengers: number;
    kilometers: number;
    has_gps: boolean;
    insurance_per_seat: boolean;
  };
  certifications: {
    road_safety: boolean;
    customer_service: boolean;
    transport_regulations: boolean;
    last_training_date: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  code: 'airport_santiago' | 'city_km' | 'package_delivery' | 'driver_8h' | 'extra_hour' | 'waiting_time' | 'emergency_vehicle';
  description: string;
  base_price: number;
  pricing_unit: 'fixed' | 'per_km' | 'per_hour' | 'per_30min';
  includes: string[];
  is_active: boolean;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time?: string;
  estimated_duration: number; // en minutos
  service_type_id: string;
  service_type?: ServiceType;
  price: number;
  max_passengers: number;
  driver_id: string;
  driver?: Driver;
  vehicle_category: 'sedan_ejecutivo' | 'sedan_lujo' | 'minivan_ejecutiva' | 'minivan_lujo' | 'suv_ejecutiva' | 'sprinter';
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  special_instructions?: string;
  includes_tolls: boolean;
  includes_parking: boolean;
  gps_tracking: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  trip_id: string;
  user_id: string;
  trip?: Trip;
  user?: User;
  passenger_count: number;
  passenger_names: string[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickup_location: string;
  dropoff_location: string;
  special_requirements?: string;
  contact_phone: string;
  flight_number?: string; // Para servicios de aeropuerto
  waiting_time?: number; // En minutos
  extra_stops?: Array<{
    location: string;
    duration: number;
  }>;
  payment_status: 'pending' | 'paid' | 'failed';
  confirmation_code: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  reservation_id: string;
  description: string;
  weight: number; // en kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  recipient_name: string;
  recipient_phone: string;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  reservation_id: string;
  user_id: string;
  driver_id: string;
  overall_rating: number;
  punctuality_rating: number;
  vehicle_condition_rating: number;
  driver_service_rating: number;
  comment?: string;
  would_recommend: boolean;
  created_at: string;
}

export interface PerformanceReport {
  id: string;
  period_start: string;
  period_end: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_revenue: number;
  average_rating: number;
  driver_performance: Array<{
    driver_id: string;
    total_trips: number;
    average_rating: number;
    incidents: number;
  }>;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'admin' | 'client';
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface VehicleCategory {
  id: string;
  name: string;
  code: 'sedan_ejecutivo' | 'sedan_lujo' | 'minivan_ejecutiva' | 'minivan_lujo' | 'suv_ejecutiva' | 'sprinter';
  description: string;
  max_passengers: number;
  luggage_capacity: string;
  features: string[];
  base_price_multiplier: number;
  examples: string[]; // Ejemplos de vehículos
}

export interface PricingRule {
  id: string;
  service_type_id: string;
  vehicle_category: string;
  base_price: number;
  per_km_rate?: number;
  per_hour_rate?: number;
  waiting_time_rate?: number;
  night_surcharge?: number;
  weekend_surcharge?: number;
  holiday_surcharge?: number;
  minimum_charge?: number;
  is_active: boolean;
} 