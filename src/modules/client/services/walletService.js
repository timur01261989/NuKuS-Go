import * as walletApi from "@/services/payments/walletService";
import * as checkoutApi from "@/services/payments/checkoutService";
import * as promoApi from "@/services/payments/promoService";
import * as paymeService from "@/services/payments/paymeService";
import * as clickService from "@/services/payments/clickService";

export async function getWalletBalance(userId) {
  if (typeof walletApi.getWalletBalance === "function") {
    return walletApi.getWalletBalance(userId);
  }
  if (typeof walletApi.getBalance === "function") {
    return walletApi.getBalance(userId);
  }
  return null;
}

export async function topUpWallet(payload) {
  if (typeof walletApi.createWalletTopup === "function") {
    return walletApi.createWalletTopup(payload);
  }
  if (typeof walletApi.demoTopup === "function") {
    return walletApi.demoTopup(payload?.user_id || payload?.userId || null, payload?.amount_uzs || payload?.amount || 0);
  }
  if (typeof checkoutApi.createCheckout === "function") {
    return checkoutApi.createCheckout(payload);
  }
  throw new Error("walletService.topUpWallet is not available");
}

export async function applyPromoCode(payload) {
  if (typeof promoApi.applyPromoCode === "function") {
    return promoApi.applyPromoCode(payload);
  }
  if (typeof promoApi.redeemPromoCode === "function") {
    return promoApi.redeemPromoCode(payload);
  }
  return null;
}

const walletService = {
  ...walletApi,
  ...checkoutApi,
  ...promoApi,
  paymeService,
  clickService,
  getWalletBalance,
  topUpWallet,
  applyPromoCode,
};

export default walletService;
