import { postJson } from "./paymentHttp.js";

export function createClickCheckout(payload = {}) {
  return postJson("/api/payments/click/checkout", payload).catch(() => ({
    ok: false,
    provider: "click",
    fallback: true,
    payload,
  }));
}

export function createClickTransaction(payload = {}) {
  return postJson("/api/payments/click/transaction", payload).catch(() => ({
    ok: false,
    provider: "click",
    fallback: true,
    payload,
  }));
}

export function getClickConfig() {
  return {
    provider: "click",
    merchantId: import.meta?.env?.VITE_CLICK_MERCHANT_ID || "",
    serviceId: import.meta?.env?.VITE_CLICK_SERVICE_ID || "",
    checkoutUrl: import.meta?.env?.VITE_CLICK_CHECKOUT_URL || "",
    testMode: String(import.meta?.env?.VITE_CLICK_TEST_MODE || "true") !== "false",
  };
}

const clickService = {
  createClickCheckout,
  createClickTransaction,
  getClickConfig,
};

export default clickService;
