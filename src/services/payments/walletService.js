import { buildQueryString, getJson, postJson } from "./paymentHttp.js";

export function getWalletBalance(userId) {
  return getJson(`/api/wallet${buildQueryString({ user_id: userId })}`);
}

export function getBalance(userId) {
  return getWalletBalance(userId);
}

export function demoTopup(userId, amountUzs) {
  return postJson("/api/wallet-topup-demo", {
    user_id: userId,
    amount_uzs: amountUzs,
  });
}

export function createWalletTopup(payload = {}) {
  return postJson("/api/wallet-topup-demo", payload);
}

export function createDriverWalletTopup(payload = {}) {
  return postJson("/api/wallet-topup-demo", payload);
}

export async function getWalletSummary(userId) {
  const balancePayload = await getWalletBalance(userId).catch(() => null);
  const balance = Number(
    balancePayload?.wallet?.balance_uzs ?? balancePayload?.balance_uzs ?? balancePayload?.balance ?? balancePayload?.data?.balance ?? 0,
  );

  return {
    balance,
    currency: balancePayload?.currency || balancePayload?.wallet?.currency || "UZS",
    pending: Number(balancePayload?.pending_uzs ?? balancePayload?.pending ?? 0),
    paidOut: Number(balancePayload?.paid_out_uzs ?? balancePayload?.paidOut ?? 0),
    raw: balancePayload,
  };
}

export function getDriverWalletSummary(driverId) {
  return getWalletSummary(driverId);
}

export async function getWalletTransactions(userId) {
  const payload = await getJson(`/api/wallet/transactions${buildQueryString({ user_id: userId })}`).catch(() => null);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function getDriverWalletTransactions(driverId) {
  return getWalletTransactions(driverId);
}

const walletService = {
  getWalletBalance,
  getBalance,
  demoTopup,
  createWalletTopup,
  createDriverWalletTopup,
  getWalletSummary,
  getDriverWalletSummary,
  getWalletTransactions,
  getDriverWalletTransactions,
};

export default walletService;
