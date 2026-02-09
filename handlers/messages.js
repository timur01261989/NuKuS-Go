import { json, badRequest, serverError } from './_lib.js';
import { getSupabaseAdmin } from './_supabase.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, items: [] });
    const sb = getSupabaseAdmin();

    if (req.method === 'GET') {
      const order_id = String(req.query?.order_id||'').trim();
      if (!order_id) return badRequest(res, 'order_id kerak');
      const { data, error } = await sb.from('messages')
        .select('id,order_id,sender_user_id,body,created_at')
        .eq('order_id', order_id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return json(res, 200, { ok:true, items: data || [] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
      const order_id = String(body.order_id||'').trim();
      const sender_user_id = String(body.sender_user_id||'').trim();
      const msg = String(body.body||'').trim();
      if (!order_id) return badRequest(res, 'order_id kerak');
      if (!sender_user_id) return badRequest(res, 'sender_user_id kerak');
      if (!msg) return badRequest(res, 'body bo‘sh');

      const { data, error } = await sb.from('messages')
        .insert([{ order_id, sender_user_id, body: msg }])
        .select('id,order_id,sender_user_id,body,created_at')
        .single();
      if (error) throw error;
      return json(res, 201, { ok:true, message: data });
    }

    return json(res, 405, { ok:false, error:'Method not allowed' });
  } catch (e) {
    return serverError(res, e);
  }
}
