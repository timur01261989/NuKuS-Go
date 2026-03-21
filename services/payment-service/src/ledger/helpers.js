import { logger } from "../logger.js";

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

export function toInteger(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function findOrderById(supabase, orderId) {
  const queries = [
    () => supabase.from("orders").select("id,user_id,driver_id,status,price_uzs,amount_uzs,payment_method,payment_status,wallet_authorized_uzs,service_type,completed_at").eq("id", orderId).maybeSingle(),
    () => supabase.from("service_orders").select("id,user_id,driver_id,status,amount_uzs,payment_method,payment_status,wallet_authorized_uzs,service_type,completed_at").eq("id", orderId).maybeSingle(),
  ];

  for (const query of queries) {
    const { data, error } = await query();
    if (!error && data) return { order: data, source: data.price_uzs != null ? "orders" : "service_orders" };
  }
  return { order: null, source: null };
}

export async function ensureWallet(supabase, userId) {
  const { data: existing, error } = await supabase
    .from("wallets")
    .select("user_id,balance_uzs,reserved_uzs,is_frozen,total_spent_uzs")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && existing) return existing;

  const now = new Date().toISOString();
  const seed = {
    user_id: userId,
    balance_uzs: 0,
    reserved_uzs: 0,
    is_frozen: false,
    created_at: now,
    updated_at: now,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("wallets")
    .upsert(seed, { onConflict: "user_id" })
    .select("user_id,balance_uzs,reserved_uzs,is_frozen,total_spent_uzs")
    .maybeSingle();

  if (insertError) throw insertError;
  return inserted || seed;
}

export async function insertWalletTransaction(supabase, payload) {
  const candidateTables = ["wallet_transactions", "wallet_ledger"];
  let lastError = null;
  for (const table of candidateTables) {
    const { error } = await supabase.from(table).insert(payload);
    if (!error) return { table };
    lastError = error;
  }
  if (lastError) {
    logger.error("wallet_transaction_insert_failed", { message: lastError.message });
    throw lastError;
  }
  throw new Error("wallet_transaction_insert_failed");
}

export async function updateOrderPaymentState(supabase, sourceTable, orderId, patch) {
  if (!sourceTable || !orderId) return;
  const { error } = await supabase.from(sourceTable).update({
    ...patch,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (error) throw error;
}

export async function processCompletionPipeline({ supabase, sourceTable, orderId, finalPriceUzs, paymentMethod }) {
  const patch = {
    status: "completed",
    completed_at: new Date().toISOString(),
    final_price_uzs: finalPriceUzs,
    payment_method: paymentMethod || "wallet",
  };
  await updateOrderPaymentState(supabase, sourceTable, orderId, patch);
  return patch;
}


export async function reserveWalletAmount(supabase, userId, amountUzs) {
  const wallet = await ensureWallet(supabase, userId);
  const balance = Number(wallet?.balance_uzs || 0);
  const reserved = Number(wallet?.reserved_uzs || 0);
  const nextReserved = reserved + Math.max(Number(amountUzs || 0), 0);
  const { error } = await supabase
    .from("wallets")
    .update({
      reserved_uzs: nextReserved,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
  return { wallet, balance, reserved, nextReserved };
}

export async function captureReservedWalletAmount(supabase, userId, amountUzs) {
  const wallet = await ensureWallet(supabase, userId);
  const balance = Number(wallet?.balance_uzs || 0);
  const reserved = Number(wallet?.reserved_uzs || 0);
  const amount = Math.max(Number(amountUzs || 0), 0);
  const reservationUsed = Math.min(reserved, amount);
  const extraDebit = Math.max(amount - reservationUsed, 0);

  if (balance < extraDebit) {
    const error = new Error("insufficient_wallet_balance");
    error.code = "INSUFFICIENT_WALLET_BALANCE";
    error.balance_uzs = balance;
    error.required_uzs = amount;
    error.extra_debit_uzs = extraDebit;
    throw error;
  }

  const { error } = await supabase
    .from("wallets")
    .update({
      balance_uzs: Math.max(balance - extraDebit, 0),
      reserved_uzs: Math.max(reserved - reservationUsed, 0),
      total_spent_uzs: Number(wallet?.total_spent_uzs || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;

  return {
    wallet,
    balanceBefore_uzs: balance,
    reservedBefore_uzs: reserved,
    reservationUsed_uzs: reservationUsed,
    extraDebit_uzs: extraDebit,
    nextBalance_uzs: Math.max(balance - extraDebit, 0),
    nextReserved_uzs: Math.max(reserved - reservationUsed, 0),
  };
}
