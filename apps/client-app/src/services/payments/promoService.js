import { postJson } from "./paymentHttp.js";

export function validatePromo(code, order_total_uzs) {
  return postJson("/api/promo-validate", { code, order_total_uzs });
}

export function applyPromoCode(payload = {}) {
  const code = payload.code || payload.promo_code || "";
  const orderTotal = payload.order_total_uzs ?? payload.amount_uzs ?? payload.amount ?? 0;
  return validatePromo(code, orderTotal);
}

export function redeemPromoCode(payload = {}) {
  return applyPromoCode(payload);
}

const promoService = {
  validatePromo,
  applyPromoCode,
  redeemPromoCode,
};

export default promoService;
