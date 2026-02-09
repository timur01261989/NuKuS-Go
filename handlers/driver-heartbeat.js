import { json, badRequest, serverError, nowIso, store, hit } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const driver_user_id = String(body.driver_user_id||'').trim();
    const is_online = !!body.is_online;
    const lat = body.lat === undefined ? null : Number(body.lat);
    const lng = body.lng === undefined ? null : Number(body.lng);
    const bearing = body.bearing === undefined ? null : Number(body.bearing);

    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!hit(`hb:${driver_user_id}`, 900)) return json(res, 200, { ok:true, skipped:true });

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb.from('driver_presence').upsert([{
        driver_user_id, is_online, lat, lng, bearing, updated_at: nowIso()
      }], { onConflict: 'driver_user_id' }).select('*').single();
      if (error) throw error;
      return json(res, 200, { ok:true, presence: data });
    }

    const db = store();
    db.driver_presence = db.driver_presence || {};
    db.driver_presence[driver_user_id] = { driver_user_id, is_online, lat, lng, bearing, updated_at: nowIso() };
    return json(res, 200, { ok:true, presence: db.driver_presence[driver_user_id], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}
