import { json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';

// Ensure req.query exists (Vercel/Node request does NOT always provide it)
function ensureQuery(req) {
  try {
    if (!req.query) {
      const url = new URL(req.url, 'http://localhost');
      req.query = Object.fromEntries(url.searchParams.entries());
    }
  } catch {
    if (!req.query) req.query = {};
  }
}


// [import moved to top] import { json, badRequest, serverError } from '../_shared/cors.js';
// [import moved to top] import { getSupabaseAdmin } from '../_shared/supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export async function wallet_balance_handler(req, res) {
  ensureQuery(req);

  try {
    if (req.method !== 'GET') return json(res, 405, { ok:false, error:'Method not allowed' });
    const user_id = String(req.query?.user_id||'').trim();
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');
const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('wallets').select('user_id,balance_uzs,updated_at').eq('user_id', user_id).maybeSingle();
    if (error) throw error;
    return json(res, 200, { ok:true, wallet: data || { user_id, balance_uzs: 0 } });
  } catch (e) { return serverError(res, e); }
}

// [import moved to top] import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
// [import moved to top] import { getSupabaseAdmin } from '../_shared/supabase.js';
function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export async function wallet_topup_demo_handler(req, res) {
  ensureQuery(req);

  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const user_id = String(body.user_id||'').trim();
    const amount_uzs = Number(body.amount_uzs||0);
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) return badRequest(res, 'amount_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va service role key (SUPABASE_SERVICE_ROLE_KEY) server envda yo\'q');
const sb = getSupabaseAdmin();
    const { data: cur } = await sb.from('wallets').select('balance_uzs').eq('user_id', user_id).maybeSingle();
    const nextBal = Number(cur?.balance_uzs||0) + Math.round(amount_uzs);

    const { error: we } = await sb.from('wallets').upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
    if (we) throw we;

    const { data: tx, error: te } = await sb.from('wallet_transactions').insert([{ user_id, amount_uzs: Math.round(amount_uzs), kind:'topup', meta:{ demo:true } }]).select('*').single();
    if (te) throw te;

    return json(res, 200, { ok:true, balance_uzs: nextBal, tx });
  } catch (e) { return serverError(res, e); }
}

// [import moved to top] import { json, badRequest, serverError } from '../_shared/cors.js';
export async function cashback_calc_handler(req, res) {
  ensureQuery(req);

  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const final_price_uzs = Number(body.final_price_uzs||0);
    const service_type = String(body.service_type||'standard').toLowerCase();
    if (!Number.isFinite(final_price_uzs) || final_price_uzs <= 0) return badRequest(res, 'final_price_uzs noto‘g‘ri');
    let rate = 0.01;
    if (service_type === 'comfort') rate = 0.02;
    if (service_type === 'truck') rate = 0.0;
    return json(res, 200, { ok:true, cashback_uzs: Math.round(final_price_uzs * rate), rate });
  } catch (e) { return serverError(res, e); }
}

export default async function handler(req, res) {
  ensureQuery(req);

  // req.routeKey is set by api/index.js; fallback to query param or path
  const rk = req.routeKey || (req.query && req.query.routeKey) || '';
  switch (rk) {
    case 'wallet':
      return await wallet_balance_handler(req, res);
    case 'wallet-topup-demo':
      return await wallet_topup_demo_handler(req, res);
    case 'cashback-calc':
      return await cashback_calc_handler(req, res);
    default:
      // If this module is used directly (without index router), run the first handler.
      return await wallet_balance_handler(req, res);
  }
}
