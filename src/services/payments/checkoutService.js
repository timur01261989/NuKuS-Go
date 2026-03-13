import { postJson } from "./paymentHttp.js";

export function applyPromoToOrder({ order_id, user_id, code, order_total_uzs }) {
  return postJson("/api/order-apply-promo", { order_id, user_id: user_id || null, code, order_total_uzs });
}

export function payOrderWithWallet({ order_id, user_id, amount_uzs }) {
  return postJson("/api/order-pay-wallet", { order_id, user_id: user_id || null, amount_uzs });
}

export function completeOrder({ order_id, user_id, driver_id, final_price_uzs, service_type }) {
  return postJson("/api/order-complete", {
    order_id,
    user_id: user_id || null,
    driver_id,
    final_price_uzs,
    service_type,
  });
}

export function createCheckout(payload = {}) {
  return postJson("/api/order-pay-wallet", payload);
}

const checkoutService = {
  applyPromoToOrder,
  payOrderWithWallet,
  completeOrder,
  createCheckout,
};

export default checkoutService;
