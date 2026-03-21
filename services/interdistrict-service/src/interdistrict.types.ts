export type TripMode = "standard" | "premium";
export type TripStatus = "open" | "full" | "departed" | "completed" | "canceled";

export interface InterDistrictTrip {
  id: string;
  driver_id: string;
  from_district: string;
  to_district: string;
  from_region: string;
  to_region: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat_uzs: number;
  mode: TripMode;
  status: TripStatus;
  vehicle_type?: string;
  created_at: string;
}

export interface DistrictBooking {
  id: string;
  trip_id: string;
  user_id: string;
  seats: number;
  status: "confirmed" | "canceled";
  total_price_uzs: number;
  pickup_point?: { lat: number; lng: number; address: string };
  created_at: string;
}
