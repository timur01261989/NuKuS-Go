import { postJson } from "./paymentHttp.js";

export function applyPromoToOrder({ order_id, user_id, code, order_total_uzs }) {
  return postJson("/api/payments/promo/apply", { order_id, user_id: user_id || null, code, order_total_uzs });
}

export function payOrderWithWallet({ order_id, user_id, amount_uzs }) {
  return postJson("/api/payments/wallet/checkout", { order_id, user_id: user_id || null, amount_uzs });
}

export function completeOrder({ order_id, user_id, driver_id, final_price_uzs, service_type }) {
  return postJson("/api/payments/wallet/complete", {
    order_id,
    user_id: user_id || null,
    driver_id,
    final_price_uzs,
    service_type,
  });
}

export function createCheckout(payload = {}) {
  return postJson("/api/payments/wallet/checkout", payload);
}

const checkoutService = {
  applyPromoToOrder,
  payOrderWithWallet,
  completeOrder,
  createCheckout,
};

export default checkoutService;
