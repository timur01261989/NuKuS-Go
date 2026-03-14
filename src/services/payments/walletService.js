import { buildQueryString, getJson, postJson } from './paymentHttp.js';

export function getWalletBalance(userId) {
  return getJson(`/api/wallet${buildQueryString({ user_id: userId })}`);
}

export function getBalance(userId) {
  return getWalletBalance(userId);
}

export function demoTopup(userId, amountUzs) {
  return postJson('/api/wallet-topup-demo', {
    user_id: userId,
    amount_uzs: amountUzs,
  });
}

export function createWalletTopup(payload = {}) {
  return postJson('/api/wallet-topup-demo', payload);
}

export function createDriverWalletTopup(payload = {}) {
  return postJson('/api/wallet-topup-demo', payload);
}

export function spendWalletFunds(payload = {}) {
  return postJson('/api/wallet', {
    action: 'spend',
    user_id: payload.user_id,
    amount_uzs: payload.amount_uzs,
    spend_mode: payload.spend_mode || 'main',
    service_type: payload.service_type || null,
    order_id: payload.order_id || null,
    description: payload.description || null,
  });
}

export async function getWalletSummary(userId) {
  const balancePayload = await getWalletBalance(userId).catch(() => null);
  const wallet = balancePayload?.wallet || balancePayload || {};
  return {
    balance: Number(wallet?.balance_uzs || 0),
    bonusBalance: Number(wallet?.bonus_balance_uzs || 0),
    currency: balancePayload?.currency || wallet?.currency || 'UZS',
    pending: Number(wallet?.reserved_uzs || balancePayload?.pending_uzs || balancePayload?.pending || 0),
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
  spendWalletFunds,
  getWalletSummary,
  getDriverWalletSummary,
  getWalletTransactions,
  getDriverWalletTransactions,
};

export default walletService;
