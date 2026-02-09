import { json, badRequest, serverError, uid, nowIso, store } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();

      if (req.method === 'GET') {
        const { data, error } = await sb.from('orders')
          .select('id,pickup,dropoff,status,created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return json(res, 200, { ok:true, items: data || [] });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const pickup = body.pickup;
        const dropoff = body.dropoff;
        if (!pickup || !dropoff) return badRequest(res, 'pickup va dropoff kerak');

        const { data, error } = await sb.from('orders').insert([{
          pickup,
          dropoff,
          status: 'created'
        }]).select('id,status,created_at').single();

        if (error) throw error;
        return json(res, 201, { ok:true, order: data });
      }

      return json(res, 405, { ok:false, error:'Method not allowed' });
    }

    // demo fallback
    const db = store();
    if (req.method === 'GET') return json(res, 200, { ok:true, items: db.orders.slice(0, 100) });
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const pickup = body.pickup;
      const dropoff = body.dropoff;
      if (!pickup || !dropoff) return badRequest(res, 'pickup va dropoff kerak');
      const order = { id: uid('ord'), pickup, dropoff, status:'created', created_at: nowIso() };
      db.orders.unshift(order);
      return json(res, 201, { ok:true, order });
    }
    return json(res, 405, { ok:false, error:'Method not allowed' });
  } catch (e) {
    return serverError(res, e);
  }
}
