export type DeliveryStatus =
  | "draft" | "searching" | "accepted" | "picked_up" | "delivered" | "canceled";

export interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  parcel_type: "document" | "package" | "food" | "fragile" | "other";
  weight_kg?: number;
  pickup:  { lat: number; lng: number; address: string; contact_name?: string; contact_phone?: string };
  dropoff: { lat: number; lng: number; address: string; contact_name?: string; contact_phone?: string };
  status: DeliveryStatus;
  price_uzs: number;
  who_pays: "sender" | "receiver";
  door_to_door: boolean;
  comment?: string;
  pin_code?: string;
  created_at: string;
  updated_at?: string;
}
