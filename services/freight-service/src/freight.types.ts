export type FreightStatus = "draft" | "searching" | "matched" | "accepted" | "in_transit" | "completed" | "canceled";
export type VehicleType = "motoroller" | "labo_damas" | "gazel" | "isuzu_kamaz" | "fura";

export interface CargoOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  vehicle_type: VehicleType;
  cargo_description: string;
  weight_kg?: number;
  volume_m3?: number;
  loaders_count: number;
  pickup:  { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  status: FreightStatus;
  price_uzs: number;
  created_at: string;
  updated_at?: string;
}
