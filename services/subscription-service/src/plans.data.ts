import { Plan } from "./subscription.types";

export const PLANS: Record<string, Plan> = {
  basic: {
    id: "basic", name: "Basic", name_uz: "Asosiy",
    price_monthly: 0, price_yearly: 0,
    benefits: {
      ride_discount_pct: 0, free_cancellations: 2, priority_matching: false,
      no_surge: false, cashback_pct: 0, free_rides_per_month: 0,
      airport_ride_discount: 0, vip_support: false, family_members: 0, food_discount_pct: 0,
    },
  },
  plus: {
    id: "plus", name: "UniGo Plus", name_uz: "UniGo Plus",
    price_monthly: 29_900, price_yearly: 299_000,
    benefits: {
      ride_discount_pct: 10, free_cancellations: 5, priority_matching: true,
      no_surge: false, cashback_pct: 3, free_rides_per_month: 2,
      airport_ride_discount: 15, vip_support: false, family_members: 1, food_discount_pct: 10,
    },
  },
  premium: {
    id: "premium", name: "UniGo Premium", name_uz: "UniGo Premium",
    price_monthly: 79_900, price_yearly: 799_000,
    benefits: {
      ride_discount_pct: 20, free_cancellations: 999, priority_matching: true,
      no_surge: true, cashback_pct: 5, free_rides_per_month: 5,
      airport_ride_discount: 30, vip_support: true, family_members: 3, food_discount_pct: 20,
    },
  },
  corporate: {
    id: "corporate", name: "UniGo Business", name_uz: "UniGo Biznes",
    price_monthly: 199_900, price_yearly: 1_999_000,
    benefits: {
      ride_discount_pct: 25, free_cancellations: 999, priority_matching: true,
      no_surge: true, cashback_pct: 7, free_rides_per_month: 10,
      airport_ride_discount: 40, vip_support: true, family_members: 10, food_discount_pct: 25,
    },
  },
};
