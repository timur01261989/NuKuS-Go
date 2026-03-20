import { getSupabaseAdmin, getAuthedUserId } from "../_shared/auth.js";
import { logger } from "../_shared/logger.js";
import {
  json,
  toText,
  toInteger,
  ensureWallet,
  findOrderById,
  insertWalletTransaction,
  updateOrderPaymentState,
  processCompletionPipeline,
  reserveWalletAmount,
  captureReservedWalletAmount,
} from "../_shared/payments/helpers.js";
import {
  getPaymentAction,
  parseBody,
  buildProviderCheckoutResponse,
  handlePaymeTransaction,
  handleClickTransaction,
  findExistingOrderAuthorization,
  findExistingOrderCapture,
} from "./payments.shared.js";

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
    const existingCapture = await findExistingOrderCapture(supabase, orderId);

    if (existingCapture?.id || String(order?.payment_status || "").toLowerCase() === "paid") {
      return json(res, 200, {
        ok: true,
        provider: "wallet",
        order_id: orderId,
        user_id: canonicalUserId,
        amount_uzs: payableAmount,
        payment_status: "paid",
        duplicate_capture_skipped: true,
        wallet_balance_uzs: balance,
      });
    }

    const existingAuthorization = await findExistingOrderAuthorization(supabase, orderId);
    if (existingAuthorization?.id || String(order?.payment_status || "").toLowerCase() === "authorized") {
      return json(res, 200, {
        ok: true,
        provider: "wallet",
        order_id: orderId,
        user_id: canonicalUserId,
        amount_uzs: payableAmount,
        payment_status: "authorized",
        duplicate_authorization_skipped: true,
        wallet_balance_uzs: balance,
      });
    }

    await reserveWalletAmount(supabase, canonicalUserId, payableAmount);

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
        reserved_uzs: payableAmount,
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

  const orderStatus = String(order?.status || "").toLowerCase();
  if (orderStatus === "completed") {
    return json(res, 200, {
      ok: true,
      provider: "wallet",
      order_id: orderId,
      user_id: canonicalUserId,
      amount_uzs: 0,
      payment_status: "paid",
      already_completed: true,
    });
  }

  const amountToCapture = finalPriceUzs ?? toInteger(order.price_uzs ?? order.amount_uzs);
  if (!amountToCapture || amountToCapture <= 0) {
    return json(res, 400, { ok: false, error: "amount_invalid", code: "AMOUNT_INVALID" });
  }

  const wallet = await ensureWallet(supabase, canonicalUserId);
  const balance = Number(wallet?.balance_uzs || 0);
  const reserved = Number(wallet?.reserved_uzs || 0);
  const extraDebitNeeded = Math.max(amountToCapture - reserved, 0);
  if (balance < extraDebitNeeded) {
    return json(res, 409, {
      ok: false,
      error: "insufficient_wallet_balance",
      code: "INSUFFICIENT_WALLET_BALANCE",
      balance_uzs: balance,
      reserved_uzs: reserved,
      required_uzs: amountToCapture,
      extra_debit_uzs: extraDebitNeeded,
    });
  }

  try {
    const existingCapture = await findExistingOrderCapture(supabase, orderId);

    if (existingCapture?.id || String(order?.payment_status || "").toLowerCase() === "paid") {
      return json(res, 200, {
        ok: true,
        provider: "wallet",
        order_id: orderId,
        user_id: canonicalUserId,
        amount_uzs: amountToCapture,
        payment_status: "paid",
        duplicate_capture_skipped: true,
        wallet_balance_uzs: balance,
      });
    }

    const captureResult = await captureReservedWalletAmount(supabase, canonicalUserId, amountToCapture);

    await insertWalletTransaction(supabase, {
      user_id: canonicalUserId,
      amount_uzs: -Math.abs(amountToCapture),
      transaction_type: "order_capture",
      status: "completed",
      source_table: source,
      source_id: orderId,
      metadata: {
        request_id: req.requestId || null,
        reservation_used_uzs: captureResult.reservationUsed_uzs,
        extra_debit_uzs: captureResult.extraDebit_uzs,
      },
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
      wallet_balance_uzs: captureResult.nextBalance_uzs,
      wallet_reserved_uzs: captureResult.nextReserved_uzs,
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



async function handlePaymeCheckout(_req, res, body) {
  return json(res, 200, buildProviderCheckoutResponse("payme", body));
}

async function handleClickCheckout(_req, res, body) {
  return json(res, 200, buildProviderCheckoutResponse("click", body));
}





export default async function handler(req, res) {
  // Supabase env yo'q bo'lsa darhol 503 qaytaramiz
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 503, {
      ok: false,
      error: 'server_config_missing',
      code: 'SERVER_CONFIG_MISSING',
    });
  }

  try {
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
        return json(res, 404, {
          ok: false,
          error: "payment_route_not_found",
          code: "PAYMENT_ROUTE_NOT_FOUND",
          action,
        });
    }
  } catch (err) {
    logger.error("payments_handler_error", { message: err?.message || String(err) });
    return json(res, 500, {
      ok: false,
      error: "internal_server_error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}


export const __testables = { handleWalletCheckout, handleWalletComplete };
