import offerHandler from './offer.js';
import walletHandler from './wallet.js';

/**
 * billing.js
 * Unified billing handler to keep server/api module count <= 10.
 * It dispatches to legacy offer.js and wallet.js based on req._unigo_route.
 */
export default async function billingHandler(req, res) {
  const route = String(req._unigo_route || req.url || '');
  if (route.includes('wallet')) return walletHandler(req, res);
  return offerHandler(req, res);
}
