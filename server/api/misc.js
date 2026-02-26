/**
 * server/api/misc.js
 * Combines pricing + gamification APIs under one router (to keep Vercel API routes <= 10)
 */
import pricingHandler from "./pricing.js";
import gamificationHandler from "./gamification.js";

export default async function miscHandler(req, res) {
  const raw = (req.query?.path || req.url || "").toString().toLowerCase();
  const path = (req.query?.__subpath || "").toString().toLowerCase();
  const p = path || raw;

  if (p.includes("game") || p.includes("bonus") || p.includes("ref") || p.includes("reward") || p.includes("spin")) {
    return gamificationHandler(req, res);
  }
  return pricingHandler(req, res);
}
