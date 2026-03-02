// server/_shared/rateLimit.js
import { nowIso } from './cors.js';

// DB-backed sliding window (simple).
export async function rateLimit({ sb, key, windowSec=60, limit=120 }) {
  const now = Date.now();
  const windowStart = new Date(now - windowSec * 1000).toISOString();

  // read row
  const { data, error } = await sb.from('api_rate_limits').select('*').eq('key', key).maybeSingle();
  if (error) throw error;

  if (!data) {
    await sb.from('api_rate_limits').insert([{
      key,
      window_start: nowIso(),
      count: 1,
      updated_at: nowIso(),
    }]);
    return { allowed: true, remaining: limit - 1 };
  }

  const ws = new Date(data.window_start).getTime();
  if (Number.isFinite(ws) && ws < new Date(windowStart).getTime()) {
    // reset window
    await sb.from('api_rate_limits').update({ window_start: nowIso(), count: 1, updated_at: nowIso() }).eq('key', key);
    return { allowed: true, remaining: limit - 1 };
  }

  if (data.count >= limit) return { allowed: false, remaining: 0 };

  await sb.from('api_rate_limits').update({ count: data.count + 1, updated_at: nowIso() }).eq('key', key);
  return { allowed: true, remaining: Math.max(0, limit - (data.count + 1)) };
}