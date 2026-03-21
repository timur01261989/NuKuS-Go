export interface RideOrder {
  id: string;
  client_id: string;
  driver_id?: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  status: "searching" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled";
  price_uzs: number;
  created_at: string;
}

export type RideStatus = RideOrder["status"];
