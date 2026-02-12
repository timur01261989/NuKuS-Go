import { json, badRequest, serverError, nowIso, hit } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

/* =========================
   ENV CHECK (NEW SUPABASE COMPATIBLE)
========================= */
function hasSupabaseEnv() {
  return !!(
    process.env.SUPABASE_URL &&
    (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY
    )
  );
}

/* =========================
   STATE ALLOWED
========================= */
const ALLOWED = new Set([
  'offline',
  'online',
  'busy',
  'on_trip',
  'pause'
]);

/* =========================
   HANDLER
========================= */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const driver_user_id = String(body.driver_user_id || '').trim();
    const state = String(body.state || '').trim().toLowerCase();

    if (!driver_user_id) {
      return badRequest(res, 'driver_user_id kerak');
    }

    if (!ALLOWED.has(state)) {
      return badRequest(res, 'state noto‘g‘ri');
    }

    /* =========================
       RATE LIMIT (prevent spam)
    ========================= */
    if (!hit(`ds:${driver_user_id}`, 800)) {
      return json(res, 200, { ok: true, skipped: true });
    }

    /* =========================
       DEMO MODE (no env)
    ========================= */
    if (!hasSupabaseEnv()) {
      console.warn("⚠️ Supabase ENV missing — demo mode");
      return json(res, 200, { ok: true, demo: true, state });
    }

    /* =========================
       CONNECT ADMIN
    ========================= */
    const sb = getSupabaseAdmin();

    const is_online = state !== 'offline';

    const { data, error } = await sb
      .from('driver_presence')
      .upsert(
        [{
          driver_user_id,
          is_online,
          updated_at: nowIso()
        }],
        { onConflict: 'driver_user_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      throw error;
    }

    return json(res, 200, {
      ok: true,
      presence: data,
      state
    });

  } catch (e) {
    console.error("DRIVER STATE ERROR:", e);
    return serverError(res, e);
  }
}
