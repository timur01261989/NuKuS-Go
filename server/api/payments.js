import { getSupabaseAdmin, getAuthedUserId } from "../_shared/auth.js";
import { logger } from "../_shared/logger.js";
import { verifyPaymeSignature, verifyClickSignature } from "../_shared/auth-headers.js";
import {
  json,
  toText,
  toInteger,
  ensureWallet,
  findOrderById,
  insertWalletTransaction,
  updateOrderPaymentState,
  processCompletionPipeline,
} from "../_shared/payments/helpers.js";

function getPathname(req) {
  return new URL(req.url, "http://localhost").pathname;
}

function getPaymentAction(req, body) {
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

async function parseBody(req) {
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

async function handleWalletCheckout(req, res, body, supabase, authedUserId) {
  const orderId = toText(body?.order_id);
  const amount = toInteger(body?.amount_uzs);
  const explicitUserId = toText(body?.user_id);
  const canonicalUserId = authedUserId || explicitUserId || null;

  if (!orderId) return json(res, 400, { ok: false, error: "order_id_required", code: "ORDER_ID_REQUIRED" });
  if (!canonicalUserId) return json(res, 401, { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });

  const { order, source } = await findOrderById(supabase, orderId);
  if (!order) return json(res, 404, { ok: false, error: "order_not_found", code: "ORDER_NOT_FOUND" });
  if (order.user_id && String(order.user_id) !== String(canonicalUserId)) {
    return json(res, 403, { ok: false, error: "forbidden", code: "FORBIDDEN" });
  }

  const payableAmount = amount ?? toInteger(order.price_uzs ?? order.amount_uzs);
  if (!payableAmount || payableAmount <= 0) {
    return json(res, 400, { ok: false, error: "amount_invalid", code: "AMOUNT_INVALID" });
  }

  const wallet = await ensureWallet(supabase, canonicalUserId);
  const balance = Number(wallet?.balance_uzs || 0);
  if (wallet?.is_frozen) {
    return json(res, 403, { ok: false, error: "wallet_frozen", code: "WALLET_FROZEN" });
  }
  if (balance < payableAmount) {
    return json(res, 409, {
      ok: false,
      error: "insufficient_wallet_balance",
      code: "INSUFFICIENT_WALLET_BALANCE",
      balance_uzs: balance,
      required_uzs: payableAmount,
      missing_uzs: Math.max(payableAmount - balance, 0),
    });
  }

  try {
    await updateOrderPaymentState(supabase, source, orderId, {
      payment_method: "wallet",
      payment_status: "authorized",
      wallet_authorized_uzs: payableAmount,
    });

    await insertWalletTransaction(supabase, {
      user_id: canonicalUserId,
      amount_uzs: -Math.abs(payableAmount),
      transaction_type: "order_authorize",
      status: "authorized",
      source_table: source,
      source_id: orderId,
      metadata: {
        request_id: req.requestId || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return json(res, 200, {
      ok: true,
      provider: "wallet",
      order_id: orderId,
      user_id: canonicalUserId,
      amount_uzs: payableAmount,
      payment_status: "authorized",
      source_table: source,
    });
  } catch (error) {
    logger.error("wallet_checkout_failed", { requestId: req.requestId, orderId, message: error?.message });
    return json(res, 500, { ok: false, error: "wallet_checkout_failed", code: "WALLET_CHECKOUT_FAILED" });
  }
}

async function handleWalletComplete(req, res, body, supabase, authedUserId) {
  const orderId = toText(body?.order_id);
  const explicitUserId = toText(body?.user_id);
  const canonicalUserId = authedUserId || explicitUserId || null;
  const finalPriceUzs = toInteger(body?.final_price_uzs ?? body?.amount_uzs);

  if (!orderId) return json(res, 400, { ok: false, error: "order_id_required", code: "ORDER_ID_REQUIRED" });
  if (!canonicalUserId) return json(res, 401, { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });

  const { order, source } = await findOrderById(supabase, orderId);
  if (!order) return json(res, 404, { ok: false, error: "order_not_found", code: "ORDER_NOT_FOUND" });
  if (order.user_id && String(order.user_id) !== String(canonicalUserId)) {
    return json(res, 403, { ok: false, error: "forbidden", code: "FORBIDDEN" });
  }

  const amountToCapture = finalPriceUzs ?? toInteger(order.price_uzs ?? order.amount_uzs);
  if (!amountToCapture || amountToCapture <= 0) {
    return json(res, 400, { ok: false, error: "amount_invalid", code: "AMOUNT_INVALID" });
  }

  const wallet = await ensureWallet(supabase, canonicalUserId);
  const balance = Number(wallet?.balance_uzs || 0);
  if (balance < amountToCapture) {
    return json(res, 409, {
      ok: false,
      error: "insufficient_wallet_balance",
      code: "INSUFFICIENT_WALLET_BALANCE",
      balance_uzs: balance,
      required_uzs: amountToCapture,
    });
  }

  try {
    const nextBalance = Math.max(balance - amountToCapture, 0);
    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        balance_uzs: nextBalance,
        total_spent_uzs: Number(wallet.total_spent_uzs || 0) + amountToCapture,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", canonicalUserId);

    if (walletUpdateError) throw walletUpdateError;

    await insertWalletTransaction(supabase, {
      user_id: canonicalUserId,
      amount_uzs: -Math.abs(amountToCapture),
      transaction_type: "order_capture",
      status: "completed",
      source_table: source,
      source_id: orderId,
      metadata: { request_id: req.requestId || null },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const completion = await processCompletionPipeline({
      supabase,
      sourceTable: source,
      orderId,
      finalPriceUzs: amountToCapture,
      paymentMethod: "wallet",
    });

    return json(res, 200, {
      ok: true,
      provider: "wallet",
      order_id: orderId,
      user_id: canonicalUserId,
      amount_uzs: amountToCapture,
      payment_status: "paid",
      wallet_balance_uzs: nextBalance,
      completion,
    });
  } catch (error) {
    logger.error("wallet_complete_failed", { requestId: req.requestId, orderId, message: error?.message });
    return json(res, 500, { ok: false, error: "wallet_complete_failed", code: "WALLET_COMPLETE_FAILED" });
  }
}

async function handlePromoApply(req, res, body, _supabase, _authedUserId) {
  req.body = body;
  const promo = await import("./promo.js");
  return promo.default(req, res);
}

function buildProviderCheckoutResponse(provider, body) {
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

async function handlePaymeCheckout(_req, res, body) {
  return json(res, 200, buildProviderCheckoutResponse("payme", body));
}

async function handleClickCheckout(_req, res, body) {
  return json(res, 200, buildProviderCheckoutResponse("click", body));
}

async function handlePaymeTransaction(req, res, body) {
  const signature = req.headers?.["x-payme-signature"] || req.headers?.["x-signature"] || body?.signature || "";
  const verified = verifyPaymeSignature(body, signature);
  return json(res, verified ? 200 : 401, {
    ok: verified,
    provider: "payme",
    verified,
    code: verified ? "PAYME_SIGNATURE_OK" : "PAYME_SIGNATURE_INVALID",
  });
}

async function handleClickTransaction(_req, res, body) {
  const verified = verifyClickSignature(body);
  return json(res, verified ? 200 : 401, {
    ok: verified,
    provider: "click",
    verified,
    code: verified ? "CLICK_SIGNATURE_OK" : "CLICK_SIGNATURE_INVALID",
  });
}

export default async function handler(req, res) {
  const body = await parseBody(req);
  const action = getPaymentAction(req, body);
  const supabase = getSupabaseAdmin();
  const authedUserId = await getAuthedUserId(req, supabase);

  switch (action) {
    case "wallet_checkout":
      return handleWalletCheckout(req, res, body, supabase, authedUserId);
    case "wallet_complete":
      return handleWalletComplete(req, res, body, supabase, authedUserId);
    case "promo_apply":
      return handlePromoApply(req, res, body, supabase, authedUserId);
    case "payme_checkout":
      return handlePaymeCheckout(req, res, body, supabase, authedUserId);
    case "payme_transaction":
      return handlePaymeTransaction(req, res, body, supabase, authedUserId);
    case "click_checkout":
      return handleClickCheckout(req, res, body, supabase, authedUserId);
    case "click_transaction":
      return handleClickTransaction(req, res, body, supabase, authedUserId);
    default:
      return json(res, 404, { ok: false, error: "payment_route_not_found", code: "PAYMENT_ROUTE_NOT_FOUND", action });
  }
}
