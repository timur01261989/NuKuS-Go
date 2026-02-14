// api/order.js
// Combined order: create + status + complete/cancel/pay/promo/etc.

import { getSupabaseAdmin } from "./_supabase.js";
import { getSupabaseAdmin } from './_shared/supabase.js';
import { json, badRequest, serverError } from './_shared/cors.js';
import { json, badRequest, serverError, nowIso } from './_shared/cors.js';
import { json, badRequest, serverError, nowIso, store } from './_shared/cors.js';
import { json, badRequest, serverError, uid, nowIso, isPhone, clampInt, store } from './_shared/cors.js';
import { json, badRequest, serverError, uid, nowIso, store } from './_shared/cors.js';
import { json, serverError, nowIso } from './_shared/cors.js';


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function orders_handler(req, res) {
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


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * POST /api/order-status
 * body: { order_id, status, driver_user_id? }
 * Updates orders.status (+ optional driver_user_id assignment)
 */
export async function order_status_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || '').trim();
    const status = String(body.status || '').trim();
    const driver_user_id = body.driver_user_id ? String(body.driver_user_id).trim() : null;

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!status) return badRequest(res, 'status kerak');

    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();
      const patch = { status };
      if (driver_user_id) patch.driver_user_id = driver_user_id;
      // timestamps (optional)
      if (status === 'accepted') patch.accepted_at = nowIso();
      if (status === 'arrived') patch.arrived_at = nowIso();
      if (status === 'in_progress') patch.started_at = nowIso();
      if (status === 'completed') patch.completed_at = nowIso();
      if (status === 'cancelled') patch.cancelled_at = nowIso();

      const { data, error } = await sb
        .from('orders')
        .update(patch)
        .eq('id', order_id)
        .select('id,status,driver_user_id,created_at')
        .single();

      if (error) throw error;
      return json(res, 200, { ok:true, order: data });
    }

    // demo fallback
    const db = store();
    db.orders = db.orders || [];
    const idx = db.orders.findIndex(o => o.id === order_id);
    if (idx === -1) return badRequest(res, 'Order topilmadi');
    db.orders[idx] = { ...db.orders[idx], status, driver_user_id: driver_user_id || db.orders[idx].driver_user_id };
    return json(res, 200, { ok:true, order: db.orders[idx], demo:true });
  } catch (e) {
    return serverError(res, e);
  }
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function order_cancel_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const order_id = String(body.order_id||'').trim();
    const cancelled_by = String(body.cancelled_by||'').trim();
    const cancel_reason = String(body.cancel_reason||'').trim();

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!['client','driver'].includes(cancelled_by)) return badRequest(res, 'cancelled_by client|driver');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('orders')
      .update({ status:'cancelled', cancelled_by, cancel_reason, cancelled_at: nowIso() })
      .eq('id', order_id)
      .select('id,status,cancelled_by,cancel_reason')
      .single();
    if (error) throw error;
    return json(res, 200, { ok:true, order: data });
  } catch (e) {
    return serverError(res, e);
  }
}

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function cashbackRate(service_type){
  const st = String(service_type||'standard').toLowerCase();
  if (st === 'comfort') return 0.02;
  if (st === 'truck') return 0.0;
  return 0.01;
}

export async function order_complete_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const client_user_id = String(b.client_user_id||'').trim();
    const driver_user_id = String(b.driver_user_id||'').trim();
    const final_price_uzs = Math.round(Number(b.final_price_uzs||0));
    const service_type = String(b.service_type||'standard');
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!client_user_id) return badRequest(res, 'client_user_id kerak');
    if (!driver_user_id) return badRequest(res, 'driver_user_id kerak');
    if (!Number.isFinite(final_price_uzs) || final_price_uzs <= 0) return badRequest(res, 'final_price_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true });

    const sb = getSupabaseAdmin();
    const rate = cashbackRate(service_type);
    const cashback_uzs = Math.round(final_price_uzs * rate);

    const { data: od, error: oe } = await sb.from('orders')
      .update({ status:'completed', completed_at: nowIso(), final_price_uzs: final_price_uzs, cashback_uzs })
      .eq('id', order_id)
      .select('id,status,final_price_uzs,cashback_uzs')
      .single();
    if (oe) throw oe;

    if (cashback_uzs > 0) {
      const { data: w } = await sb.from('wallets').select('balance_uzs').eq('user_id', client_user_id).maybeSingle();
      const bal = Number(w?.balance_uzs||0);
      const nextBal = bal + cashback_uzs;
      await sb.from('wallets').upsert([{ user_id: client_user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
      await sb.from('wallet_transactions').insert([{ user_id: client_user_id, amount_uzs: cashback_uzs, kind:'cashback', ref_order_id: order_id, meta:{ rate } }]);
    }

    const { data: st } = await sb.from('driver_stats').select('*').eq('driver_user_id', driver_user_id).maybeSingle();
    const completed_count = Number(st?.completed_count||0) + 1;
    await sb.from('driver_stats').upsert([{ driver_user_id, completed_count, updated_at: nowIso(), rating_avg: st?.rating_avg ?? 5.0, cancel_count: st?.cancel_count ?? 0, acceptance_rate: st?.acceptance_rate ?? 1.0 }], { onConflict:'driver_user_id' });

    return json(res, 200, { ok:true, order: od, cashback_uzs, rate });
  } catch (e) { return serverError(res, e); }
}

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

export async function order_pay_wallet_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const user_id = String(b.user_id||'').trim();
    const amount_uzs = Math.round(Number(b.amount_uzs||0));
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!Number.isFinite(amount_uzs) || amount_uzs <= 0) return badRequest(res, 'amount_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, paid:false });

    const sb = getSupabaseAdmin();
    const { data: w, error: we } = await sb.from('wallets').select('balance_uzs').eq('user_id', user_id).maybeSingle();
    if (we) throw we;
    const bal = Number(w?.balance_uzs||0);
    if (bal < amount_uzs) return json(res, 200, { ok:true, paid:false, reason:'insufficient', balance_uzs: bal });

    const nextBal = bal - amount_uzs;
    const { error: up } = await sb.from('wallets').upsert([{ user_id, balance_uzs: nextBal, updated_at: nowIso() }], { onConflict:'user_id' });
    if (up) throw up;

    const { data: tx, error: te } = await sb.from('wallet_transactions').insert([{
      user_id, amount_uzs: -amount_uzs, kind:'payment', ref_order_id: order_id, meta:{ method:'wallet' }
    }]).select('*').single();
    if (te) throw te;

    const { data: od, error: oe } = await sb.from('orders')
      .update({ paid_with_wallet:true, final_price_uzs: amount_uzs })
      .eq('id', order_id)
      .select('id,paid_with_wallet,final_price_uzs')
      .single();
    if (oe) throw oe;

    return json(res, 200, { ok:true, paid:true, balance_uzs: nextBal, tx, order: od });
  } catch (e) { return serverError(res, e); }
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function order_pay_complete_handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const order_id = String(b.order_id || "").trim();
    const amount_uzs = Math.round(Number(b.amount_uzs || 0));

    if (!order_id) return badRequest(res, "order_id kerak");

    // Agar server env yo'q bo'lsa — demo javob
    if (!hasSupabaseEnv()) return json(res, 200, { ok: true, demo: true });

    const sb = getSupabaseAdmin();

    // Minimal update: orderga final_price_uzs yozib qo'yamiz
    const patch = { final_price_uzs: Number.isFinite(amount_uzs) && amount_uzs > 0 ? amount_uzs : null, updated_at: nowIso?.() };
    const { data, error } = await sb
      .from("orders")
      .update(patch)
      .eq("id", order_id)
      .select("id, final_price_uzs")
      .single();

    if (error) throw error;

    return json(res, 200, { ok: true, order: data });
  } catch (e) {
    return serverError(res, e);
  }
}

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function computeDiscount(row, orderTotal) {
  const kind = (row.kind || 'percent').toLowerCase();
  const val = Number(row.value||0);
  let d = 0;
  if (kind === 'fixed') d = val;
  else d = Math.round(orderTotal * (val/100));
  if (d < 0) d = 0;
  if (d > orderTotal) d = orderTotal;
  return d;
}

export async function order_apply_promo_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const order_id = String(b.order_id||'').trim();
    const user_id = String(b.user_id||'').trim();
    const code = String(b.code||'').trim().toUpperCase();
    const order_total_uzs = Number(b.order_total_uzs||0);
    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!user_id) return badRequest(res, 'user_id kerak');
    if (!code) return badRequest(res, 'code kerak');
    if (!Number.isFinite(order_total_uzs) || order_total_uzs <= 0) return badRequest(res, 'order_total_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, applied:false });

    const sb = getSupabaseAdmin();
    const { data: row, error: pe } = await sb.from('promo_codes').select('*').eq('code', code).maybeSingle();
    if (pe) throw pe;
    if (!row || !row.is_active) return json(res, 200, { ok:true, applied:false, reason:'invalid' });

    const now = new Date();
    if (row.starts_at && now < new Date(row.starts_at)) return json(res, 200, { ok:true, applied:false, reason:'not_started' });
    if (row.ends_at && now > new Date(row.ends_at)) return json(res, 200, { ok:true, applied:false, reason:'expired' });
    if (row.max_uses != null && Number(row.used_count||0) >= Number(row.max_uses)) return json(res, 200, { ok:true, applied:false, reason:'max_uses' });
    if (row.min_order_uzs != null && order_total_uzs < Number(row.min_order_uzs)) return json(res, 200, { ok:true, applied:false, reason:'min_order' });

    const discount_uzs = computeDiscount(row, order_total_uzs);

    const { data: od, error: oe } = await sb.from('orders')
      .update({ promo_code: code, promo_discount_uzs: discount_uzs })
      .eq('id', order_id)
      .select('id,promo_code,promo_discount_uzs')
      .single();
    if (oe) throw oe;

    const { error: re } = await sb.from('promo_redemptions')
      .upsert([{ code, user_id, order_id, discount_uzs, created_at: nowIso() }], { onConflict: 'code,user_id,order_id' });
    if (re) throw re;

    await sb.from('promo_codes').update({ used_count: Number(row.used_count||0)+1 }).eq('code', code);
    return json(res, 200, { ok:true, applied:true, order: od, discount_uzs });
  } catch (e) { return serverError(res, e); }
}

function hasSupabaseEnv(){ return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }

function computeDiscount(row, orderTotal) {
  const kind = (row.kind || 'percent').toLowerCase();
  const val = Number(row.value||0);
  let d = 0;
  if (kind === 'fixed') d = val;
  else d = Math.round(orderTotal * (val/100));
  if (d < 0) d = 0;
  if (d > orderTotal) d = orderTotal;
  return d;
}

export async function promo_validate_handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const code = String(b.code||'').trim().toUpperCase();
    const order_total_uzs = Number(b.order_total_uzs||0);
    if (!code) return badRequest(res, 'code kerak');
    if (!Number.isFinite(order_total_uzs) || order_total_uzs <= 0) return badRequest(res, 'order_total_uzs noto‘g‘ri');
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, valid:false });

    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb.from('promo_codes').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    if (!row || !row.is_active) return json(res, 200, { ok:true, valid:false });

    const now = new Date();
    if (row.starts_at && now < new Date(row.starts_at)) return json(res, 200, { ok:true, valid:false, reason:'not_started' });
    if (row.ends_at && now > new Date(row.ends_at)) return json(res, 200, { ok:true, valid:false, reason:'expired' });
    if (row.max_uses != null && Number(row.used_count||0) >= Number(row.max_uses)) return json(res, 200, { ok:true, valid:false, reason:'max_uses' });
    if (row.min_order_uzs != null && order_total_uzs < Number(row.min_order_uzs)) return json(res, 200, { ok:true, valid:false, reason:'min_order' });

    const discount_uzs = computeDiscount(row, order_total_uzs);
    return json(res, 200, { ok:true, valid:true, code, discount_uzs, kind: row.kind, value: row.value });
  } catch (e) { return serverError(res, e); }
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /api/cron-expire-orders?minutes=2
 * Marks 'searching' orders older than N minutes as 'expired'
 * Use with Vercel Cron or external scheduler.
 */
export async function cron_expire_orders_handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return json(res, 200, { ok:true, demo:true, expired:0 });
    const sb = getSupabaseAdmin();

    const minutes = Number(req.query?.minutes || 2);
    const cutoff = new Date(Date.now() - minutes*60*1000).toISOString();

    const { data, error } = await sb.from('orders')
      .update({ status: 'expired', cancelled_at: nowIso(), cancelled_by: 'system', cancel_reason: 'timeout' })
      .eq('status', 'searching')
      .lt('created_at', cutoff)
      .select('id');
    if (error) throw error;

    return json(res, 200, { ok:true, expired: (data||[]).length });
  } catch (e) {
    return serverError(res, e);
  }
}


function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function market_listings_handler(req, res) {
  try {
    // --- Supabase mode (production) ---
    if (hasSupabaseEnv()) {
      const sb = getSupabaseAdmin();

      if (req.method === 'GET') {
        const limit = clampInt(req.query?.limit, 1, 100, 50);
        const sort = String(req.query?.sort || 'newest');

        let q = sb.from('market_listings')
          .select('id,title,price_uzs,year,mileage_km,fuel,gearbox,city,phone,description,state,created_at,market_listing_images(url,sort)')
          .limit(limit);

        if (sort === 'price_asc') q = q.order('price_uzs', { ascending: true });
        else if (sort === 'price_desc') q = q.order('price_uzs', { ascending: false });
        else q = q.order('created_at', { ascending: false });

        const { data, error } = await q;
        if (error) throw error;

        const items = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          price_uzs: Number(r.price_uzs || 0),
          year: r.year,
          mileage_km: r.mileage_km,
          fuel: r.fuel,
          gearbox: r.gearbox,
          city: r.city,
          phone: r.phone,
          desc: r.description,
          state: r.state,
          created_at: r.created_at,
          image: (r.market_listing_images || []).sort((a,b)=>(a.sort||0)-(b.sort||0))[0]?.url || '/market/sample/cobalt.svg',
          images: (r.market_listing_images || []).sort((a,b)=>(a.sort||0)-(b.sort||0)).map(x=>x.url),
          source: 'supabase'
        }));

        return json(res, 200, { ok: true, items });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

        const title = String(body.title || '').trim();
        const price_uzs = Number(body.price_uzs || 0);
        const phone = String(body.phone || '').trim();

        if (!title) return badRequest(res, 'Sarlavha (title) kerak', { field:'title' });
        if (price_uzs <= 0) return badRequest(res, 'Narx noto‘g‘ri', { field:'price_uzs' });
        if (phone && !isPhone(phone)) return badRequest(res, 'Telefon noto‘g‘ri', { field:'phone' });

        const { data: ins, error: insErr } = await sb.from('market_listings').insert([{
          title,
          price_uzs,
          year: Number(body.year || 0) || null,
          mileage_km: Number(body.mileage_km || 0) || null,
          fuel: String(body.fuel || ''),
          gearbox: String(body.gearbox || ''),
          city: String(body.city || ''),
          phone,
          description: String(body.desc || ''),
          state: 'pending'
        }]).select('id,created_at').single();

        if (insErr) throw insErr;

        const images = Array.isArray(body.images) ? body.images : [];
        const cover = String(body.image || images[0] || '');
        const urls = [cover, ...images.filter(x => x && x !== cover)].filter(Boolean).slice(0, 10);

        if (urls.length) {
          const rows = urls.map((url, i) => ({ listing_id: ins.id, url, sort: i }));
          const { error: imgErr } = await sb.from('market_listing_images').insert(rows);
          if (imgErr) throw imgErr;
        }

        return json(res, 201, { ok:true, item: { id: ins.id, created_at: ins.created_at } });
      }

      return json(res, 405, { ok:false, error:'Method not allowed' });
    }

    // --- Demo mode (no Supabase) ---
    const db = store();

    if (req.method === 'GET') {
      const limit = clampInt(req.query?.limit, 1, 100, 50);
      const sort = String(req.query?.sort || 'newest');
      let items = [...db.listings];
      if (sort === 'price_asc') items.sort((a,b)=>(a.price_uzs||0)-(b.price_uzs||0));
      else if (sort === 'price_desc') items.sort((a,b)=>(b.price_uzs||0)-(a.price_uzs||0));
      else items.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      return json(res, 200, { ok:true, items: items.slice(0, limit) });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const title = String(body.title || '').trim();
      const price_uzs = Number(body.price_uzs || 0);
      const phone = String(body.phone || '').trim();
      if (!title) return badRequest(res, 'Sarlavha (title) kerak', { field:'title' });
      if (price_uzs <= 0) return badRequest(res, 'Narx noto‘g‘ri', { field:'price_uzs' });
      if (phone && !isPhone(phone)) return badRequest(res, 'Telefon noto‘g‘ri', { field:'phone' });

      const item = {
        id: uid('car'),
        title,
        price_uzs,
        year: Number(body.year || 0),
        mileage_km: Number(body.mileage_km || 0),
        fuel: String(body.fuel || ''),
        gearbox: String(body.gearbox || ''),
        city: String(body.city || ''),
        phone,
        desc: String(body.desc || ''),
        image: String(body.image || ''),
        images: Array.isArray(body.images) ? body.images : [],
        state: 'pending',
        created_at: nowIso(),
        source: 'api_memory',
      };
      db.listings.unshift(item);
      return json(res, 201, { ok:true, item });
    }

    return json(res, 405, { ok:false, error:'Method not allowed' });
  } catch (e) {
    return serverError(res, e);
  }
}

async function order_status_router(req, res, key) {
  switch (key) {
    case 'order-status':
      return await order_status_handler(req, res);
    case 'order-cancel':
      return await order_cancel_handler(req, res);
    case 'order-complete':
      return await order_complete_handler(req, res);
    case 'order-pay-wallet':
      return await order_pay_wallet_handler(req, res);
    case 'order-pay-complete':
      return await order_pay_complete_handler(req, res);
    case 'order-apply-promo':
      return await order_apply_promo_handler(req, res);
    case 'promo-validate':
      return await promo_validate_handler(req, res);
    case 'cron-expire-orders':
      return await cron_expire_orders_handler(req, res);
    case 'market-listings':
      return await market_listings_handler(req, res);
    default:
      // Fallback to status
      return await order_status_handler(req, res);
  }
}

export default async function order(req, res, routeKey = 'order') {
  const url = new URL(req.url, 'http://localhost');
  const bodyObj = (() => {
    try { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return {}; }
  })();

  // If called through unified router with an explicit key:
  if (routeKey === 'order-create') return await order_create_handler(req, res);
  if (routeKey !== 'order') return await order_status_router(req, res, routeKey);

  // New consolidated endpoint /api/order:
  const action = url.searchParams.get('action') || bodyObj.action || null;

  if (action === 'create') return await order_create_handler(req, res);

  // Allow calling old action names via action param
  const key = action || 'order-status';
  return await order_status_router(req, res, key);
}
