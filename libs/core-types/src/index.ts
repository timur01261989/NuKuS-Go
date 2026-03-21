// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  phone: string;
  full_name?: string;
  avatar_url?: string;
  role: "client" | "driver" | "admin";
  created_at: string;
}

// ─── Driver ───────────────────────────────────────────────────────────────────
export interface Driver {
  id: string;
  user_id: string;
  status: "online" | "offline" | "on_trip";
  vehicle: Vehicle;
  rating: number;
  lat?: number;
  lng?: number;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate_number: string;
  color: string;
  type: "sedan" | "minivan" | "suv" | "truck";
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  client_id: string;
  driver_id?: string;
  pickup: GeoPoint;
  dropoff: GeoPoint;
  status: OrderStatus;
  price_uzs: number;
  service_type: ServiceType;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus = "searching" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled";
export type ServiceType = "taxi" | "delivery" | "freight" | "intercity" | "interdistrict";

// ─── Geo ──────────────────────────────────────────────────────────────────────
export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: { total?: number; page?: number; limit?: number };
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentProvider = "payme" | "click" | "uzcard" | "humo" | "wallet" | "cash";
export interface PaymentMethod {
  id: string;
  user_id: string;
  provider: PaymentProvider;
  is_default: boolean;
  last4?: string;
}
