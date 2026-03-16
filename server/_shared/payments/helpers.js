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
    () => supabase.from("orders").select("id,user_id,driver_id,status,price_uzs,amount_uzs,payment_method,service_type,completed_at").eq("id", orderId).maybeSingle(),
    () => supabase.from("service_orders").select("id,user_id,driver_id,status,amount_uzs,payment_method,service_type,completed_at").eq("id", orderId).maybeSingle(),
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
    .select("user_id,balance_uzs,reserved_uzs,is_frozen")
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
    .select("user_id,balance_uzs,reserved_uzs,is_frozen")
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
    logger.warn("wallet_transaction_insert_skipped", { message: lastError.message });
  }
  return null;
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
