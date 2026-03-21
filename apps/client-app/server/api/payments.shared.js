import { json, toText, toInteger } from "../_shared/payments/helpers.js";
import { verifyPaymeSignature, verifyClickSignature } from "../_shared/auth-headers.js";

export function getPathname(req) {
  return new URL(req.url, "http://localhost").pathname;
}

export function getPaymentAction(req, body) {
  const path = getPathname(req);
  if (path.includes("/payments/wallet/checkout") || path.includes("/order-pay-wallet")) return "wallet_checkout";
  if (path.includes("/payments/wallet/complete") || path.includes("/order-complete")) return "wallet_complete";
  if (path.includes("/payments/promo/apply") || path.includes("/order-apply-promo")) return "promo_apply";
  if (path.includes("/payments/payme/checkout")) return "payme_checkout";
  if (path.includes("/payments/payme/transaction")) return "payme_transaction";
  if (path.includes("/payments/click/checkout")) return "click_checkout";
  if (path.includes("/payments/click/transaction")) return "click_transaction";
  return String(body?.action || "").trim().toLowerCase();
}

export async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return {};
}

export function buildProviderCheckoutResponse(provider, body) {
  const amountUzs = toInteger(body?.amount_uzs ?? body?.amount ?? 0) || 0;
  return {
    ok: true,
    provider,
    checkout_id: `${provider}_${Date.now()}`,
    merchant_trans_id: toText(body?.merchant_trans_id || body?.order_id || body?.transaction_id || ""),
    order_id: toText(body?.order_id),
    amount_uzs: amountUzs,
    redirect_url: provider === "payme"
      ? `${process.env.PAYME_CHECKOUT_URL || ""}`
      : `${process.env.CLICK_CHECKOUT_URL || ""}`,
    status: "created",
  };
}

export async function handlePaymeTransaction(req, res, body) {
  const signature = req.headers?.["x-payme-signature"] || req.headers?.["x-signature"] || body?.signature || "";
  const verified = verifyPaymeSignature(body, signature);
  return json(res, verified ? 200 : 401, {
    ok: verified,
    provider: "payme",
    verified,
    code: verified ? "PAYME_SIGNATURE_OK" : "PAYME_SIGNATURE_INVALID",
  });
}

export async function handleClickTransaction(_req, res, body) {
  const verified = verifyClickSignature(body);
  return json(res, verified ? 200 : 401, {
    ok: verified,
    provider: "click",
    verified,
    code: verified ? "CLICK_SIGNATURE_OK" : "CLICK_SIGNATURE_INVALID",
  });
}

export async function findExistingOrderAuthorization(supabase, orderId) {
  const existingAuthorization = await supabase
    .from("wallet_transactions")
    .select("id,created_at,status,amount_uzs")
    .eq("source_id", orderId)
    .eq("transaction_type", "order_authorize")
    .limit(1)
    .maybeSingle();

  return existingAuthorization?.data || null;
}

export async function findExistingOrderCapture(supabase, orderId) {
  const existingCapture = await supabase
    .from("wallet_transactions")
    .select("id,created_at")
    .eq("source_id", orderId)
    .eq("transaction_type", "order_capture")
    .limit(1)
    .maybeSingle();

  return existingCapture?.data || null;
}
