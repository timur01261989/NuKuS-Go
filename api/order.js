// api/order.js
// Create taxi order (and shared order endpoint)

import { json, badRequest, serverError } from './_shared/cors.js';
import { getSupabase } from './_shared/supabase.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return json(res, 405, { ok:false, error:'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // Accept old/new field names
    const passenger_id = String(body.passenger_id || body.client_id || '').trim();
    const passenger_name = body.passenger_name ?? body.client_name ?? null;
    const passenger_phone = body.passenger_phone ?? body.client_phone ?? null;

    if (!passenger_id) {
      return badRequest(res, 'client_id (yoki passenger_id) shart');
    }

    // Use service role if exists, else ANON + forwarded JWT
    const sb = getSupabase(req, { admin: true });

    const payload = {
      passenger_id,
      passenger_name,
      passenger_phone,
      seats: Number(body.seats || 1),
      status: body.status || 'created',
      note: body.note || null,
      pickup_lat: body.pickup_lat ?? body.from_lat ?? null,
      pickup_lng: body.pickup_lng ?? body.from_lng ?? null,
      pickup_address: body.pickup_address ?? body.from_address ?? null,
      dropoff_lat: body.dropoff_lat ?? body.to_lat ?? null,
      dropoff_lng: body.dropoff_lng ?? body.to_lng ?? null,
      dropoff_address: body.dropoff_address ?? body.to_address ?? null,
      service_type: body.service_type ?? body.tariff ?? 'standard',
      price_uzs: body.price_uzs ?? body.price ?? null,
      distance_m: body.distance_m ?? null,
      duration_s: body.duration_s ?? null,
      meta: body.meta ?? null,
    };

    // remove undefined fields
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }

    const { data, error } = await sb
      .from('orders')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;

    return json(res, 200, { ok:true, order: data });
  } catch (e) {
    return serverError(res, e);
  }
}
