// server/api/order_status.js
// Stage-4: Wallet + penalty hooks (SAFE / additive).
// - Updates order status with basic transition checks (best-effort).
// - Logs events to order_events (best-effort).
// - Optionally settles wallet on completion and applies penalty on cancel (gated + safe fallbacks).
//
// IMPORTANT:
// - Does NOT change existing order creation/dispatch logic.
// - All wallet/penalty operations are best-effort; failures never break the main status update.

import { json, badRequest, serverError, nowIso } from '../_shared/cors.js';
import { getSupabaseAdmin } from '../_shared/supabase.js';
import { canTransition } from '../_shared/tripState.js';

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function envTrue(name, defaultVal = false) {
  const v = process.env[name];
  if (v == null || String(v).trim() === '') return defaultVal;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

async function logOrderEvent(sb, payload) {
  try {
    await sb.from('order_events').insert([{
      order_id: String(payload.order_id || ''),
      event: String(payload.event || ''),
      from_status: payload.from_status ?? null,
      to_status: payload.to_status ?? null,
      actor_role: payload.actor_role ?? null,
      actor_id: payload.actor_id ?? null,
      reason: payload.reason ?? null,
      created_at: nowIso(),
    }]);
  } catch (_) {
    // ignore
  }
}

async function ensureWallet(sb, user_id) {
  // Creates wallet row if missing. Safe if table doesn't exist (it will error and be caught by callers).
  const uid = String(user_id || '').trim();
  if (!uid) return { ok: false, error: 'user_id missing' };

  const { data: w, error: se } = await sb.from('wallets').select('*').eq('user_id', uid).maybeSingle();
  if (se) return { ok: false, error: se };
  if (w) return { ok: true, wallet: w };

  const { data: created, error: ie } = await sb.from('wallets').insert([{ user_id: uid }]).select('*').single();
  if (ie) return { ok: false, error: ie };
  return { ok: true, wallet: created };
}

async function walletTx(sb, { user_id, amount_uzs, kind, description, order_id, meta }) {
  const uid = String(user_id || '').trim();
  if (!uid) return { ok: false, error: 'user_id missing' };

  // Ensure wallet row exists first (best-effort).
  await ensureWallet(sb, uid);

  const row = {
    user_id: uid,
    amount_uzs: Number(amount_uzs || 0),
    kind: String(kind || ''),
    description: description ?? null,
    order_id: order_id ?? null,
    meta: meta ?? null,
    created_at: nowIso(),
  };

  const { data, error } = await sb.from('wallet_transactions').insert([row]).select('*').single();
  if (error) return { ok: false, error };
  return { ok: true, data };
}

async function updateWalletBalance(sb, user_id, delta_uzs) {
  // Best-effort balance update. If balance columns exist, we'll adjust; otherwise we silently skip.
  try {
    const uid = String(user_id || '').trim();
    if (!uid) return { ok: false, error: 'user_id missing' };

    const w0 = await ensureWallet(sb, uid);
    if (!w0.ok) return w0;

    const bal = Number(w0.wallet.balance_uzs || 0);
    const next = bal + Number(delta_uzs || 0);

    const { error } = await sb.from('wallets').update({
      balance_uzs: next,
      updated_at: nowIso(),
    }).eq('user_id', uid);

    if (error) return { ok: false, error };
    return { ok: true, balance_uzs: next };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function settleWalletOnComplete(sb, order, actor) {
  // Gated by env + order flags to avoid changing current cash flows.
  const enabled = envTrue('FEATURE_WALLET_SETTLEMENT', false);
  if (!enabled) return { ok: false, skipped: true, reason: 'FEATURE_WALLET_SETTLEMENT disabled' };

  // Only settle if order explicitly indicates wallet usage.
  const payment_method = String(order?.payment_method || order?.pay_method || '').toLowerCase();
  const use_wallet = !!(order?.use_wallet || order?.is_wallet_payment || payment_method === 'wallet');

  if (!use_wallet) return { ok: false, skipped: true, reason: 'order not marked as wallet payment' };

  const client_id = order?.client_id;
  const driver_id = order?.driver_id;
  const price = Number(order?.price || 0);

  if (!client_id || !driver_id || !(price > 0)) {
    return { ok: false, skipped: true, reason: 'missing passenger/driver/price' };
  }

  // Passenger spend (-price), Driver bonus (+price) as a simple settlement model.
  // NOTE: this is additive and can be replaced later with a commissions model.
  const meta = { order_id: order.id, actor: actor || null, type: 'ride_settlement' };

  try {
    await walletTx(sb, { user_id: client_id, amount_uzs: price, kind: 'spend', description: 'Ride payment', order_id: order.id, meta });
    await updateWalletBalance(sb, client_id, -price);

    await walletTx(sb, { user_id: driver_id, amount_uzs: price, kind: 'bonus', description: 'Ride earning', order_id: order.id, meta });
    await updateWalletBalance(sb, driver_id, +price);

    return { ok: true, settled: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function applyCancelPenalty(sb, order, body) {
  const enabled = envTrue('FEATURE_PENALTY', false);
  if (!enabled) return { ok: false, skipped: true, reason: 'FEATURE_PENALTY disabled' };

  // Only apply if caller explicitly requests it OR if cancel happens after driver accepted/arrived/in_trip.
  const requestPenalty = !!body.apply_penalty;

  const st = String(order?.status || '').toLowerCase();
  const late = ['accepted', 'arrived', 'in_trip'].includes(st);

  if (!requestPenalty && !late) return { ok: false, skipped: true, reason: 'not late cancel' };

  const client_id = order?.client_id;
  if (!client_id) return { ok: false, skipped: true, reason: 'missing client_id' };

  // Default penalty. Can be made configurable later.
  const penalty_uzs = Number(body.penalty_uzs || 5000);
  if (!(penalty_uzs > 0)) return { ok: false, skipped: true, reason: 'invalid penalty' };

  const meta = { order_id: order.id, type: 'cancel_penalty', reason: body.reason || null };

  try {
    await walletTx(sb, { user_id: client_id, amount_uzs: penalty_uzs, kind: 'spend', description: 'Cancel penalty', order_id: order.id, meta });
    await updateWalletBalance(sb, client_id, -penalty_uzs);
    return { ok: true, penalty_applied: true, penalty_uzs };
  } catch (e) {
    return { ok: false, error: e };
  }
}


// =========================
// Stage-6: Intelligence hooks (best-effort, additive)
// =========================

async function upsertDriverGamification(sb, driver_id, deltaTrips, deltaEarningsUzs) {
  try {
    const did = String(driver_id || '').trim();
    if (!did) return { ok: false, skipped: true, reason: 'driver_id missing' };

    let r = await sb.from('driver_gamification').select('*').eq('driver_id', did).maybeSingle();
    if (r.error) return { ok: false, skipped: true, reason: r.error.message };

    const existing = r.data;
    if (!existing) {
      const ins = await sb.from('driver_gamification').insert([{
        driver_id: did,
        total_trips: Math.max(0, Number(deltaTrips || 0)),
        total_earnings_uzs: Math.max(0, Number(deltaEarningsUzs || 0)),
        updated_at: nowIso(),
      }]).select('*').single();
      if (ins.error) return { ok: false, skipped: true, reason: ins.error.message };
      return { ok: true, data: ins.data };
    }

    const nextTrips = Number(existing.total_trips || 0) + Number(deltaTrips || 0);
    const nextEarn = Number(existing.total_earnings_uzs || 0) + Number(deltaEarningsUzs || 0);

    const upd = await sb.from('driver_gamification').update({
      total_trips: nextTrips,
      total_earnings_uzs: nextEarn,
      last_trip_date: new Date().toISOString().slice(0, 10),
      updated_at: nowIso(),
    }).eq('driver_id', did).select('*').single();

    if (upd.error) return { ok: false, skipped: true, reason: upd.error.message };
    return { ok: true, data: upd.data };
  } catch (e) {
    return { ok: false, skipped: true, reason: e?.message || 'error' };
  }
}

async function applyDailyMissions(sb, driver_id, order) {
  try {
    const did = String(driver_id || '').trim();
    if (!did) return { ok: false, skipped: true, reason: 'driver_id missing' };

    let dg = await sb.from('driver_gamification').select('level_name, bonus_points').eq('driver_id', did).maybeSingle();
    const level_name = dg.data?.level_name || null;

    const ms = await sb.from('daily_missions').select('*').eq('is_active', true).eq('target_type', 'trips');
    if (ms.error) return { ok: false, skipped: true, reason: ms.error.message };

    const missions = (ms.data || []).filter(m => !m.level_name || !level_name || m.level_name === level_name);

    const results = [];
    for (const m of missions) {
      const date = new Date().toISOString().slice(0, 10);

      let p = await sb.from('mission_progress').select('*')
        .eq('mission_id', m.id).eq('driver_id', did).eq('date', date).maybeSingle();

      let current = Number(p.data?.current_value || 0);
      let completed = !!p.data?.completed;
      let rewarded = !!p.data?.rewarded;

      if (!completed) current += 1;
      if (current >= Number(m.target_value || 0)) completed = true;

      const up = await sb.from('mission_progress').upsert([{
        mission_id: m.id,
        driver_id: did,
        date,
        current_value: current,
        completed,
        rewarded,
        updated_at: nowIso(),
      }], { onConflict: 'mission_id,driver_id,date' }).select('*').single();

      if (up.error) {
        results.push({ mission_id: m.id, ok: false, error: up.error.message });
        continue;
      }

      if (completed && !rewarded) {
        const points = Number(m.bonus_points || 0);
        const uzsValue = Number(m.bonus_uzs || 0);

        if (points > 0 || uzsValue > 0) {
          await sb.from('bonus_transactions').insert([{
            user_id: did,
            kind: 'earn',
            points: Math.max(0, points),
            uzs_value: uzsValue > 0 ? uzsValue : null,
            order_id: order?.id || null,
            note: `Mission reward: ${m.title}`,
            created_at: nowIso(),
          }]);

          if (points > 0) {
            await sb.from('driver_gamification').update({
              bonus_points: Number(dg.data?.bonus_points || 0) + points,
              updated_at: nowIso(),
            }).eq('driver_id', did);
          }
        }

        await sb.from('mission_progress').update({ rewarded: true, updated_at: nowIso() })
          .eq('mission_id', m.id).eq('driver_id', did).eq('date', date);

        results.push({ mission_id: m.id, ok: true, completed: true, rewarded: true });
      } else {
        results.push({ mission_id: m.id, ok: true, completed, rewarded });
      }
    }

    return { ok: true, results };
  } catch (e) {
    return { ok: false, skipped: true, reason: e?.message || 'error' };
  }
}

function calcSpeedKmh(distanceKm, durationMin) {
  const d = Number(distanceKm || 0);
  const t = Number(durationMin || 0);
  if (!(d > 0) || !(t > 0)) return null;
  return d / (t / 60);
}

async function writeFraudFlag(sb, entity_type, entity_id, score, reason, meta) {
  try {
    if (!envTrue('FEATURE_ANTIFRAUD_WRITE', false)) return { ok: false, skipped: true, reason: 'FEATURE_ANTIFRAUD_WRITE disabled' };
    const et = String(entity_type || '').trim();
    const eid = entity_id;
    if (!et || !eid) return { ok: false, skipped: true, reason: 'missing entity' };

    const { error } = await sb.from('fraud_flags').insert([{
      entity_type: et,
      entity_id: eid,
      score: Number(score || 0),
      reason: reason ?? null,
      meta: meta ?? null,
      created_at: nowIso(),
    }]);

    if (error) return { ok: false, skipped: true, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, skipped: true, reason: e?.message || 'error' };
  }
}

async function antifraudOnComplete(sb, order) {
  try {
    if (!envTrue('FEATURE_ANTIFRAUD_WRITE', false)) return { ok: false, skipped: true, reason: 'FEATURE_ANTIFRAUD_WRITE disabled' };

    const distanceKm = order?.distance_km ?? null;
    const durationMin = order?.duration_minutes ?? order?.durationMinutes ?? order?.duration_min ?? null;
    const speed = calcSpeedKmh(distanceKm, durationMin);

    let score = 0;
    let reason = null;

    if (speed != null && speed > 120) { score += 70; reason = 'unrealistic_speed'; }
    if (Number(distanceKm || 0) > 10 && Number(durationMin || 0) < 5) { score += 60; reason = reason || 'too_fast_trip'; }
    if (Number(distanceKm || 0) === 0 && Number(order?.price || 0) > 0) { score += 40; reason = reason || 'zero_distance_paid'; }

    if (score >= 60) {
      const meta = { distance_km: distanceKm, duration_min: durationMin, speed_kmh: speed, price: order?.price || null };
      return await writeFraudFlag(sb, 'order', order.id, score, reason, meta);
    }
    return { ok: true, skipped: true, reason: 'no_flag' };
  } catch (e) {
    return { ok: false, skipped: true, reason: e?.message || 'error' };
  }
}

async function gamificationOnComplete(sb, order) {
  try {
    if (!envTrue('FEATURE_GAMIFICATION_TRIGGERS', false)) return { ok: false, skipped: true, reason: 'FEATURE_GAMIFICATION_TRIGGERS disabled' };

    const driver_id = order?.driver_id;
    const price = Number(order?.price || 0);

    if (!driver_id) return { ok: false, skipped: true, reason: 'missing driver_id' };

    const up = await upsertDriverGamification(sb, driver_id, 1, price > 0 ? price : 0);
    const missions = await applyDailyMissions(sb, driver_id, order);

    return { ok: true, driver: up.ok ? up.data : null, missions };
  } catch (e) {
    return { ok: false, skipped: true, reason: e?.message || 'error' };
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!hasSupabaseEnv()) return serverError(res, 'SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY server envda yo\'q');

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const order_id = String(body.order_id || body.id || '').trim();
    const to_status = String(body.to_status || body.status || '').trim();
    const actor_role = String(body.actor_role || body.role || '').trim() || null;
    const actor_id = String(body.actor_id || body.user_id || '').trim() || null;
    const reason = body.reason ?? null;

    if (!order_id) return badRequest(res, 'order_id kerak');
    if (!to_status) return badRequest(res, 'to_status/status kerak');

    const sb = getSupabaseAdmin();

    // Read current order state first
    const { data: cur, error: re } = await sb.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (re) throw re;
    if (!cur) return json(res, 404, { ok: false, error: 'Order topilmadi' });

    const from_status = String(cur.status || '').trim();

    // Best-effort transition check (does not hard-fail if unknown states are used elsewhere).
    // If canTransition returns false, we still allow update when body.force === true.
    const allowed = canTransition(from_status, to_status);
    if (!allowed && !body.force) {
      return json(res, 409, { ok: false, error: 'Transition not allowed', from_status, to_status });
    }

    const updatePayload = { status: to_status };

    // Additive timestamps (safe if columns exist; if not, update will retry without them)
    if (to_status === 'accepted') updatePayload.accepted_at = nowIso();
    if (to_status === 'arrived') updatePayload.arrived_at = nowIso();
    if (to_status === 'in_trip') updatePayload.started_at = nowIso();
    if (to_status === 'completed') updatePayload.completed_at = nowIso();
    if (to_status === 'cancelled' || to_status === 'canceled') updatePayload.cancelled_at = nowIso();

    let upd = await sb.from('orders').update(updatePayload).eq('id', order_id).select('*').single();
    let data = upd.data;
    let error = upd.error;

    if (error) {
      // Retry by removing timestamp columns that may not exist yet
      const msg = String(error.message || '').toLowerCase();
      const fallback = { status: to_status };
      if (!msg.includes('accepted_at')) fallback.accepted_at = updatePayload.accepted_at;
      if (!msg.includes('arrived_at')) fallback.arrived_at = updatePayload.arrived_at;
      if (!msg.includes('started_at')) fallback.started_at = updatePayload.started_at;
      if (!msg.includes('completed_at')) fallback.completed_at = updatePayload.completed_at;
      if (!msg.includes('cancelled_at') && !msg.includes('canceled_at')) fallback.cancelled_at = updatePayload.cancelled_at;

      // If the DB doesn't have any of these columns, keep only status
      if (msg.includes('accepted_at') || msg.includes('arrived_at') || msg.includes('started_at') || msg.includes('completed_at') || msg.includes('cancelled_at') || msg.includes('canceled_at')) {
        // conservative: just update status
        upd = await sb.from('orders').update({ status: to_status }).eq('id', order_id).select('*').single();
      } else {
        upd = await sb.from('orders').update(fallback).eq('id', order_id).select('*').single();
      }

      data = upd.data;
      error = upd.error;
      if (error) throw error;
    }

    await logOrderEvent(sb, {
      order_id,
      event: 'status_changed',
      from_status,
      to_status,
      actor_role,
      actor_id,
      reason,
    });

    // Stage-4: hooks (best-effort, never block)
    let settlement = null;
    let penalty = null;

    if (to_status === 'completed') {
      settlement = await settleWalletOnComplete(sb, data, { actor_role, actor_id });
      await logOrderEvent(sb, {
        order_id,
        event: settlement?.ok ? 'wallet_settled' : 'wallet_settle_skipped',
        from_status: to_status,
        to_status: to_status,
        actor_role: 'system',
        actor_id: null,
        reason: settlement?.reason || (settlement?.skipped ? 'skipped' : null),
      });

      // Stage-6: gamification + anti-fraud (best-effort, never block)
      const gamification = await gamificationOnComplete(sb, data);
      await logOrderEvent(sb, {
        order_id,
        event: gamification?.ok ? 'gamification_applied' : 'gamification_skipped',
        from_status: to_status,
        to_status: to_status,
        actor_role: 'system',
        actor_id: null,
        reason: gamification?.reason || (gamification?.skipped ? 'skipped' : null),
      });

      const fraud = await antifraudOnComplete(sb, data);
      await logOrderEvent(sb, {
        order_id,
        event: fraud?.ok ? 'fraud_checked' : 'fraud_check_skipped',
        from_status: to_status,
        to_status: to_status,
        actor_role: 'system',
        actor_id: null,
        reason: fraud?.reason || (fraud?.skipped ? 'skipped' : null),
      });

    }

    if (to_status === 'cancelled' || to_status === 'canceled') {
      penalty = await applyCancelPenalty(sb, cur, body);
      await logOrderEvent(sb, {
        order_id,
        event: penalty?.ok ? 'penalty_applied' : 'penalty_skipped',
        from_status: to_status,
        to_status: to_status,
        actor_role: 'system',
        actor_id: null,
        reason: penalty?.reason || (penalty?.skipped ? 'skipped' : null),
      });
    }

    return json(res, 200, { ok: true, data, settlement, penalty });
  } catch (e) {
    return serverError(res, e);
  }
}
