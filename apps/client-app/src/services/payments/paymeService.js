import { postJson } from "./paymentHttp.js";

export function createPaymeCheckout(payload = {}) {
  return postJson("/api/payments/payme/checkout", payload).catch(() => ({
    ok: false,
    provider: "payme",
    fallback: true,
    payload,
  }));
}

export function createPaymeTransaction(payload = {}) {
  return postJson("/api/payments/payme/transaction", payload).catch(() => ({
    ok: false,
    provider: "payme",
    fallback: true,
    payload,
  }));
}

export function getPaymeConfig() {
  return {
    provider: "payme",
    merchantId: import.meta?.env?.VITE_PAYME_MERCHANT_ID || "",
    checkoutUrl: import.meta?.env?.VITE_PAYME_CHECKOUT_URL || "",
    testMode: String(import.meta?.env?.VITE_PAYME_TEST_MODE || "true") !== "false",
  };
}

const paymeService = {
  createPaymeCheckout,
  createPaymeTransaction,
  getPaymeConfig,
};

export default paymeService;
