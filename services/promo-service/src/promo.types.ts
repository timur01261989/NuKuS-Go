export type DiscountType = "percentage" | "fixed" | "free_ride" | "cashback" | "x_for_y";
export type TargetAudience = "all" | "new_users" | "inactive_30d" | "premium" | "drivers" | "corporate";

export interface Campaign {
  id:              string;
  name:            string;
  description?:    string;
  discount_type:   DiscountType;
  discount_value:  number;        // % yoki so'm
  max_discount_uzs: number;       // Cap
  min_order_uzs:   number;        // Minimum buyurtma
  budget_uzs:      number;        // Total campaign budget
  spent_uzs:       number;
  usage_limit:     number;        // Total uses
  usage_per_user:  number;        // Per user limit
  used_count:      number;
  target_audience: TargetAudience;
  applicable_services: string[];
  promo_code?:     string;
  starts_at:       string;
  ends_at:         string;
  is_active:       boolean;
  created_at:      string;
}

export interface PromoUsage {
  id:          string;
  campaign_id: string;
  user_id:     string;
  order_id:    string;
  discount_uzs: number;
  cashback_uzs: number;
  used_at:     string;
}
