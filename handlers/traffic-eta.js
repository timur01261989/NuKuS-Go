import { json, badRequest, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';
import { haversineKm } from './_geo.js';

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok:false, error:'Method not allowed' });
    const lat = Number(req.query?.lat);
    const lng = Number(req.query?.lng);
    const base_eta_seconds = Number(req.query?.base_eta_seconds || 0);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return badRequest(res, 'lat/lng kerak');
    if (!Number.isFinite(base_eta_seconds) || base_eta_seconds <= 0) return badRequest(res, 'base_eta_seconds noto‘g‘ri');

    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, provider:'DEMO', multiplier:1.0, eta_seconds: Math.round(base_eta_seconds) });

    const sb = getSupabaseAdmin();
    const { data: zones, error } = await sb.from('traffic_zones')
      .select('center_lat,center_lng,radius_km,multiplier')
      .eq('is_active', true)
      .limit(200);
    if (error) throw error;

    let mult = 1.0;
    for (const z of (zones||[])) {
      const d = haversineKm(lat, lng, Number(z.center_lat), Number(z.center_lng));
      if (d <= Number(z.radius_km||0)) mult = Math.max(mult, Number(z.multiplier||1));
    }
    return json(res, 200, { ok:true, provider:'ZONES', multiplier: mult, eta_seconds: Math.round(base_eta_seconds * mult) });
  } catch (e) { return serverError(res, e); }
}
