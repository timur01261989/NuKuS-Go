import * as walletApi from "@/services/payments/walletService";
import * as paymeService from "@/services/payments/paymeService";
import * as clickService from "@/services/payments/clickService";

export async function fetchDriverWalletSummary(driverId) {
  if (typeof walletApi.getDriverWalletSummary === "function") {
    return walletApi.getDriverWalletSummary(driverId);
  }

  if (typeof walletApi.getWalletSummary === "function") {
    return walletApi.getWalletSummary(driverId);
  }

  return {
    balance: 0,
    currency: "UZS",
    pending: 0,
    paidOut: 0,
  };
}

export async function fetchDriverWalletTransactions(driverId) {
  if (typeof walletApi.getDriverWalletTransactions === "function") {
    return walletApi.getDriverWalletTransactions(driverId);
  }

  if (typeof walletApi.getWalletTransactions === "function") {
    return walletApi.getWalletTransactions(driverId);
  }

  return [];
}

export async function createDriverWalletTopup(payload) {
  if (typeof walletApi.createDriverWalletTopup === "function") {
    return walletApi.createDriverWalletTopup(payload);
  }

  if (typeof walletApi.createWalletTopup === "function") {
    return walletApi.createWalletTopup(payload);
  }

  return { ok: false, reason: "wallet_topup_api_missing" };
}

export { walletApi, paymeService, clickService };

export default {
  walletApi,
  paymeService,
  clickService,
  fetchDriverWalletSummary,
  fetchDriverWalletTransactions,
  createDriverWalletTopup,
};
