import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import crypto from 'crypto';

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function uuidv4() {
  return crypto.randomUUID();
}

/**
 * POST /api/payments/ledger/transfer
 * body: { from_account_id, to_account_id, amount, memo?, meta? }
 * Creates a balanced double-entry tx.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const from_account_id = Number(body.from_account_id);
    const to_account_id = Number(body.to_account_id);
    const amount = Number(body.amount);

    if (!Number.isFinite(from_account_id) || !Number.isFinite(to_account_id)) return badRequest(res, 'account ids required');
    if (!Number.isFinite(amount) || amount <= 0) return badRequest(res, 'amount must be > 0');

    if (!hasEnv()) return serverError(res, 'Missing SUPABASE env');
    const sb = getSupabaseAdmin();

    const tx_id = uuidv4();
    const memo = body.memo ?? null;
    const meta = body.meta ?? null;
    const now = nowIso();

    // debit from source, credit to dest (sum=0)
    const rows = [
      { tx_id, account_id: from_account_id, amount: -Math.abs(amount), memo, meta, created_at: now },
      { tx_id, account_id: to_account_id, amount: Math.abs(amount), memo, meta, created_at: now },
    ];

    const { error } = await sb.from('payments_ledger_entries').insert(rows);
    if (error) throw error;

    return json(res, 200, { ok:true, tx_id });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}