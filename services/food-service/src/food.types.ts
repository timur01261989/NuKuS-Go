export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

export interface Restaurant {
  id: string;
  name: string;
  logo_url?: string;
  category: string;
  rating: number;
  delivery_time_min: number;
  min_order_uzs: number;
  is_open: boolean;
  city: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price_uzs: number;
  image_url?: string;
  category: string;
  is_available: boolean;
}

export interface FoodOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  courier_id?: string;
  items: { item_id: string; quantity: number; price_uzs: number; name: string }[];
  status: OrderStatus;
  delivery_address: { lat: number; lng: number; address: string };
  subtotal_uzs: number;
  delivery_fee_uzs: number;
  total_uzs: number;
  comment?: string;
  created_at: string;
}
