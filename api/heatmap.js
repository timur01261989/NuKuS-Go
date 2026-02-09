import { json, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function cellId(lat, lng, size=0.02) {
  const a = Math.floor(lat/size)*size;
  const b = Math.floor(lng/size)*size;
  return `${a.toFixed(2)}_${b.toFixed(2)}_${size}`;
}

export default async function handler(req, res) {
  try {
    const minutes = Number(req.query?.minutes || 60);
    const cell = Number(req.query?.cell || 0.02);
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, items: [] });

    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - minutes*60*1000).toISOString();
    const { data, error } = await sb.from('orders').select('id,created_at,pickup').gte('created_at', since).limit(5000);
    if (error) throw error;

    const map = new Map();
    for (const o of (data||[])) {
      const p = o.pickup;
      if (!p || p.lat == null || p.lng == null) continue;
      const cid = cellId(Number(p.lat), Number(p.lng), cell);
      map.set(cid, (map.get(cid)||0)+1);
    }
    const items = Array.from(map.entries()).map(([cell_id, demand_count])=>({ cell_id, demand_count }))
      .sort((a,b)=>b.demand_count-a.demand_count).slice(0, 400);
    return json(res, 200, { ok:true, minutes, cell, items });
  } catch (e) { return serverError(res, e); }
}
