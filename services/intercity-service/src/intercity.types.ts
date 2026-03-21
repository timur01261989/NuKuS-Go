export type TripStatus = "draft" | "open" | "full" | "departed" | "completed" | "canceled";

export interface IntercityTrip {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  from_point?: { lat: number; lng: number };
  to_point?:   { lat: number; lng: number };
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat_uzs: number;
  status: TripStatus;
  amenities?: string[];
  created_at: string;
}

export interface SeatBooking {
  id: string;
  trip_id: string;
  user_id: string;
  seats: number;
  status: "pending" | "confirmed" | "canceled";
  total_price_uzs: number;
  created_at: string;
}
