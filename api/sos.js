import { json, badRequest, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const user_id = String(body.user_id||'').trim();
    if (!user_id) return badRequest(res, 'user_id kerak');

    const order_id = body.order_id ? String(body.order_id).trim() : null;
    const message = body.message ? String(body.message).trim() : null;
    const lat = body.lat === undefined ? null : Number(body.lat);
    const lng = body.lng === undefined ? null : Number(body.lng);

    const { data, error } = await sb.from('sos_tickets').insert([{
      order_id, user_id, message, lat, lng, status: 'open'
    }]).select('*').single();

    if (error) throw error;
    return json(res, 201, { ok:true, ticket: data });
  } catch (e) {
    return serverError(res, e);
  }
}
