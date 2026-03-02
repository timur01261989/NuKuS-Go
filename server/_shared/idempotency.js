// server/_shared/idempotency.js
// DB-backed idempotency helper.
// Requires Supabase admin client and idempotency_keys table.
import crypto from 'crypto';
import { nowIso } from './cors.js';

export function hashBody(body) {
  try {
    return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
  } catch {
    return null;
  }
}

export async function withIdempotency({ sb, key, scope, body, fn }) {
  const request_hash = hashBody(body);

  // Try read existing
  const { data: existing, error: re } = await sb.from('idempotency_keys').select('*').eq('key', key).maybeSingle();
  if (re) throw re;

  if (existing?.status === 'completed' && existing?.response) {
    return { reused: true, response: existing.response };
  }

  // Acquire / create
  if (!existing) {
    const { error: ce } = await sb.from('idempotency_keys').insert([{
      key,
      scope,
      request_hash,
      status: 'in_progress',
      created_at: nowIso(),
      updated_at: nowIso(),
    }]);
    if (ce) throw ce;
  } else {
    // If the request hash mismatches, reject (client bug or abuse)
    if (existing.request_hash && request_hash && existing.request_hash !== request_hash) {
      throw new Error('idempotency_key_reused_with_different_payload');
    }
    await sb.from('idempotency_keys').update({ status:'in_progress', updated_at: nowIso() }).eq('key', key);
  }

  // Execute
  try {
    const result = await fn();
    await sb.from('idempotency_keys').update({ status:'completed', response: result, updated_at: nowIso() }).eq('key', key);
    return { reused: false, response: result };
  } catch (e) {
    await sb.from('idempotency_keys').update({ status:'failed', response: { error: e?.message || String(e) }, updated_at: nowIso() }).eq('key', key);
    throw e;
  }
}