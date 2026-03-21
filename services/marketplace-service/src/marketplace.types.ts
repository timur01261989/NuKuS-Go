export type AdStatus = "draft" | "active" | "sold" | "deleted" | "moderation";
export type FuelType = "petrol" | "diesel" | "gas" | "electric" | "hybrid";
export type Transmission = "manual" | "automatic" | "variator";
export type BodyType = "sedan" | "suv" | "hatchback" | "minivan" | "truck" | "other";

export interface CarAd {
  id: string;
  seller_id: string;
  title?: string;
  brand: string;
  model: string;
  year: number;
  mileage_km: number;
  price_usd: number;
  price_uzs?: number;
  fuel_type: FuelType;
  transmission: Transmission;
  body_type: BodyType;
  color?: string;
  engine_cc?: number;
  description?: string;
  photos?: string[];
  city: string;
  phone: string;
  status: AdStatus;
  views: number;
  created_at: string;
  updated_at?: string;
}
