import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import {
  calculatePromoDiscount,
  getAuthedContext,
  getPromoCodeByCode,
  getProfileByUserId,
} from '../_shared/rewards.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

async function validatePromo(sb, userId, code, orderTotalUzs) {
  const promo = await getPromoCodeByCode(sb, code);
  if (!promo) {
    return { ok: false, error: 'Promo code topilmadi yoki faol emas' };
  }

  const now = new Date().toISOString();
  if (promo.starts_at && now < promo.starts_at) return { ok: false, error: 'Promo hali boshlanmagan' };
  if (promo.ends_at && now > promo.ends_at) return { ok: false, error: 'Promo muddati tugagan' };

  const profile = await getProfileByUserId(sb, userId);
  if (profile?.metadata?.is_test_user || profile?.metadata?.test_user) {
    return { ok: false, error: 'Test akkauntlarda promo ishlamaydi' };
  }

  const [{ count: totalUsed, error: totalError }, { count: userUsed, error: userError }] = await Promise.all([
    sb.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', promo.id).neq('status', 'reverted'),
    sb.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', promo.id).eq('user_id', userId).neq('status', 'reverted'),
  ]);
  if (totalError) throw totalError;
  if (userError) throw userError;

  if (promo.usage_limit_total != null && Number(totalUsed || 0) >= Number(promo.usage_limit_total)) {
    return { ok: false, error: 'Promo limiti tugagan' };
  }
  if (promo.usage_limit_per_user != null && Number(userUsed || 0) >= Number(promo.usage_limit_per_user)) {
    return { ok: false, error: 'Siz promo limitidan foydalangan bo\'lgansiz' };
  }

  const result = calculatePromoDiscount(promo, orderTotalUzs);
  if (!result.applied) {
    return {
      ok: false,
      error: result.reason === 'minimum_order_not_met'
        ? `Minimal buyurtma summasi ${promo.min_order_amount_uzs} so'm`
        : 'Promo ishlamadi',
    };
  }

  return { ok: true, promo, ...result };
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  try {
    const { sb, userId } = await getAuthedContext(req);
    const body = await readBody(req);
    const code = String(body.code || body.promo_code || '').trim().toUpperCase();
    const orderTotalUzs = Number(body.order_total_uzs || body.final_price_uzs || body.amount_uzs || 0);
    const orderId = String(body.order_id || '').trim() || null;

    if (!userId) return json(res, 401, { ok: false, error: 'Unauthorized' });
    if (!code) return badRequest(res, 'Promo code kerak');
    if (!Number.isFinite(orderTotalUzs) || orderTotalUzs <= 0) return badRequest(res, "order_total_uzs noto'g'ri");

    const validated = await validatePromo(sb, userId, code, orderTotalUzs);
    if (!validated.ok) return json(res, 200, validated);
    if (!orderId) return json(res, 200, validated);

    const promo = validated.promo;

    const { data: existingRedemption, error: existingError } = await sb
      .from('promo_redemptions')
      .select('id,user_id,promo_code_id,order_id,status,metadata')
      .eq('order_id', orderId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingRedemption && existingRedemption.status !== 'reverted') {
      return json(res, 200, {
        ok: true,
        promo,
        redemption: existingRedemption,
        ...validated,
      });
    }

    const { data: orderRow, error: orderError } = await sb
      .from('orders')
      .select('id,user_id,price_uzs,route_meta,status')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!orderRow) return badRequest(res, 'Order topilmadi');
    if (userId && String(orderRow.user_id) !== String(userId)) return json(res, 403, { ok: false, error: 'Bu order sizga tegishli emas' });
    if (['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_driver'].includes(String(orderRow.status || '').toLowerCase())) {
      return badRequest(res, 'Yakunlangan yoki bekor qilingan orderga promo qo\'llanmaydi');
    }

    if (existingRedemption?.status === 'reverted') {
      const { error: deleteError } = await sb.from('promo_redemptions').delete().eq('id', existingRedemption.id);
      if (deleteError) throw deleteError;
    }

    const { data: redemption, error: redemptionError } = await sb
      .from('promo_redemptions')
      .insert({
        promo_code_id: promo.id,
        user_id: orderRow.user_id,
        order_id: orderId,
        discount_uzs: validated.discount_uzs,
        status: 'applied',
        metadata: {
          original_order_total_uzs: Number(orderRow.price_uzs || orderTotalUzs),
          order_total_uzs: orderTotalUzs,
          final_total_uzs: validated.final_total_uzs,
          promo_code: promo.code,
          applied_at: new Date().toISOString(),
        },
      })
      .select('*')
      .single();
    if (redemptionError) throw redemptionError;

    const nextRouteMeta = {
      ...(orderRow.route_meta || {}),
      promo: {
        code: promo.code,
        promo_id: promo.id,
        redemption_id: redemption.id,
        discount_uzs: validated.discount_uzs,
        final_total_uzs: validated.final_total_uzs,
        original_order_total_uzs: Number(orderRow.price_uzs || orderTotalUzs),
        redemption_status: 'applied',
      },
    };

    const { error: updateError } = await sb
      .from('orders')
      .update({
        price_uzs: validated.final_total_uzs,
        route_meta: nextRouteMeta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    if (updateError) throw updateError;

    return json(res, 200, {
      ok: true,
      promo,
      redemption,
      discount_uzs: validated.discount_uzs,
      final_total_uzs: validated.final_total_uzs,
      order_id: orderId,
    });
  } catch (error) {
    return serverError(res, error);
  }
}
