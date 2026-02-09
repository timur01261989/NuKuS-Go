import { json, badRequest, serverError, nowIso } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
import { haversineKm } from './_geo.js';

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function score({ dist_km, rating_avg=5, acceptance_rate=1, completed_count=0 }) {
  const dist = Math.min(50, dist_km);
  const r = 6 - Math.min(5, Math.max(1, rating_avg));
  const ar = 1 - Math.min(1, Math.max(0, acceptance_rate));
  const exp = 1 / Math.sqrt(1 + Math.min(2000, completed_count));
  return dist*0.6 + r*2.0 + ar*5.0 + exp*3.0;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(body.order_id||'').trim();
    const pickup = body.pickup;
    const radius_km = Number(body.radius_km || 7);

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!pickup || !Number.isFinite(Number(pickup.lat)) || !Number.isFinite(Number(pickup.lng))) return badRequest(res, 'pickup lat/lng kerak');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, offered:0 });

    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - 2*60*1000).toISOString();

    const { data: pres, error: pe } = await sb.from('driver_presence')
      .select('driver_user_id,lat,lng,is_online,updated_at')
      .eq('is_online', true)
      .gte('updated_at', since)
      .limit(4000);
    if (pe) throw pe;

    const driverIds = (pres||[]).map(p=>p.driver_user_id);
    const { data: stats, error: se } = await sb.from('driver_stats')
      .select('driver_user_id,rating_avg,acceptance_rate,completed_count')
      .in('driver_user_id', driverIds.length?driverIds:['00000000-0000-0000-0000-000000000000'])
      .limit(4000);
    if (se) throw se;
    const statsMap = new Map((stats||[]).map(s=>[s.driver_user_id, s]));

    const ranked = (pres||[]).filter(p => p.lat != null && p.lng != null).map(p => {
      const dist_km = haversineKm(Number(p.lat), Number(p.lng), Number(pickup.lat), Number(pickup.lng));
      const st = statsMap.get(p.driver_user_id) || {};
      const s = score({ dist_km, rating_avg: st.rating_avg ?? 5, acceptance_rate: st.acceptance_rate ?? 1, completed_count: st.completed_count ?? 0 });
      return { ...p, dist_km, score: s };
    }).filter(p => p.dist_km <= radius_km).sort((a,b)=>a.score-b.score).slice(0, 15);

    const expires_at = new Date(Date.now() + 15*1000).toISOString();
    const rows = ranked.map((p)=>({ order_id, driver_user_id: p.driver_user_id, status:'sent', sent_at: nowIso(), expires_at }));
    if (rows.length) {
      const { error: oe } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_user_id' });
      if (oe) throw oe;
    }
    return json(res, 200, { ok:true, offered: rows.length, drivers: ranked.map(r=>({driver_user_id:r.driver_user_id, dist_km:r.dist_km, score:r.score})) });
  } catch (e) { return serverError(res, e); }
}
