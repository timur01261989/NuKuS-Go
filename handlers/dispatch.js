import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
import { haversineKm } from './_geo.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const order_id = String(body.order_id||'').trim();
    const pickup = body.pickup;
    const radius_km = Number(body.radius_km || 5);

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!pickup || !Number.isFinite(Number(pickup.lat)) || !Number.isFinite(Number(pickup.lng))) return badRequest(res, 'pickup lat/lng kerak');

    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, offered:0 });

    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - 2*60*1000).toISOString();

    const { data: pres, error: pe } = await sb.from('driver_presence')
      .select('driver_user_id,lat,lng,is_online,updated_at')
      .eq('is_online', true)
      .gte('updated_at', since)
      .limit(2000);
    if (pe) throw pe;

    const ranked = (pres||[])
      .filter(p => p.lat != null && p.lng != null)
      .map(p => ({...p, dist_km: haversineKm(Number(p.lat), Number(p.lng), Number(pickup.lat), Number(pickup.lng))}))
      .filter(p => p.dist_km <= radius_km)
      .sort((a,b)=>a.dist_km-b.dist_km)
      .slice(0, 15);

    const expires_at = new Date(Date.now() + 15*1000).toISOString();
    const rows = ranked.map((p)=>({ order_id, driver_user_id: p.driver_user_id, status:'sent', sent_at: nowIso(), expires_at }));

    if (rows.length) {
      const { error: oe } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_user_id' });
      if (oe) throw oe;
    }

    return json(res, 200, { ok:true, offered: rows.length, drivers: ranked.map(r=>({driver_user_id:r.driver_user_id, dist_km:r.dist_km})) });
  } catch (e) {
    return serverError(res, e);
  }
}
