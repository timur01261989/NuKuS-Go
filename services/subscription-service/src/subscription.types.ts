export type PlanId = "basic" | "plus" | "premium" | "corporate";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id:              PlanId;
  name:            string;
  name_uz:         string;
  price_monthly:   number;
  price_yearly:    number;
  benefits: {
    ride_discount_pct:      number;    // % chegirma har safar
    free_cancellations:     number;    // Oyiga bepul bekor qilishlar
    priority_matching:      boolean;   // Tezroq driver topish
    no_surge:               boolean;   // Surge pricing yo'q
    cashback_pct:           number;    // Har buyurtmadan cashback
    free_rides_per_month:   number;    // Oyiga bepul poyezdlar
    airport_ride_discount:  number;    // Aeroport chegirmasi
    vip_support:            boolean;   // 24/7 VIP support
    family_members:         number;    // Oila a'zolari soni
    food_discount_pct:      number;    // Ovqat buyurtmada chegirma
  };
}

export interface UserSubscription {
  id:           string;
  user_id:      string;
  plan_id:      PlanId;
  billing_cycle: BillingCycle;
  status:       "active" | "cancelled" | "expired" | "trial";
  starts_at:    string;
  expires_at:   string;
  auto_renew:   boolean;
  payment_method_id?: string;
  family_member_ids:  string[];
  created_at:   string;
}
