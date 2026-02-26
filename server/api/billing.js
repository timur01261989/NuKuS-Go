/**
 * server/api/billing.js
 * Combines offer + wallet APIs under one router (to keep Vercel API routes <= 10)
 */
import offerHandler from "./offer.js";
import walletHandler from "./wallet.js";

export default async function billingHandler(req, res) {
  // accept /api/billing/offer/* or /api/billing/wallet/*
  const raw = (req.query?.path || req.url || "").toString();
  const path = (req.query?.__subpath || "").toString(); // optional from main router
  const p = (path || raw).toLowerCase();

  // Heuristic: if URL contains /wallet or route key is wallet*, forward to wallet
  if (p.includes("wallet") || p.includes("balance") || p.includes("topup") || p.includes("withdraw")) {
    return walletHandler(req, res);
  }
  // Default to offer
  return offerHandler(req, res);
}
