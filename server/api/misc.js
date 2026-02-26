import gamificationHandler from './gamification.js';
import pricingHandler from './pricing.js';

/**
 * misc.js
 * Unified misc handler to keep server/api module count <= 10.
 * It dispatches to legacy pricing.js and gamification.js based on req._unigo_route.
 */
export default async function miscHandler(req, res) {
  const route = String(req._unigo_route || req.url || '');
  if (route.includes('pricing')) return pricingHandler(req, res);
  return gamificationHandler(req, res);
}
