import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getAuthedContext } from '../_shared/rewards.js';
import { getRewardService } from '../_shared/reward-engine/factory.js';

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

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  try {
    const { sb, userId } = await getAuthedContext(req);
    if (!userId) return json(res, 401, { ok: false, error: 'Unauthorized' });

    const rewardService = getRewardService(sb);
    const body = await readBody(req);
    const code = String(body.code || body.promo_code || '').trim().toUpperCase();
    const orderTotalUzs = Number(body.order_total_uzs || body.final_price_uzs || body.amount_uzs || 0);
    const orderId = String(body.order_id || '').trim() || null;

    if (!code) return badRequest(res, 'Promo code kerak');
    if (!Number.isFinite(orderTotalUzs) || orderTotalUzs <= 0) return badRequest(res, "order_total_uzs noto'g'ri");

    const validated = await rewardService.validatePromo({ userId, code, orderTotalUzs });
    if (!validated.ok) return json(res, 200, validated);
    if (!orderId) return json(res, 200, validated);

    const existingRedemption = await rewardService.repositories.promos.getRedemptionByOrderId(orderId);
    if (existingRedemption && existingRedemption.status !== 'reverted') {
      return json(res, 200, {
        ok: true,
        promo: validated.promo,
        redemption: existingRedemption,
        discount_uzs: validated.discount_uzs,
        final_total_uzs: validated.final_total_uzs,
        order_id: orderId,
      });
    }

    const orderRow = await rewardService.repositories.serviceOrders.getBySource({ sourceTable: 'orders', sourceId: orderId });
    if (!orderRow) return badRequest(res, 'Order topilmadi');
    if (String(orderRow.user_id) !== String(userId)) return json(res, 403, { ok: false, error: 'Bu order sizga tegishli emas' });

    const status = String(orderRow.status || '').toLowerCase();
    if (['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_driver'].includes(status)) {
      return badRequest(res, 'Yakunlangan yoki bekor qilingan orderga promo qo\'llanmaydi');
    }

    if (existingRedemption?.status === 'reverted') {
      await rewardService.repositories.promos.updateRedemption(existingRedemption.id, {
        status: 'reverted',
        metadata: {
          ...(existingRedemption.metadata || {}),
          overwritten_at: new Date().toISOString(),
        },
      });
    }

    const redemption = await rewardService.repositories.promos.createRedemption({
      promoCodeId: validated.promo.id,
      userId: orderRow.user_id,
      orderId,
      discountUzs: validated.discount_uzs,
      status: 'applied',
      metadata: {
        original_order_total_uzs: Number(orderRow.amount_uzs || orderTotalUzs),
        order_total_uzs: orderTotalUzs,
        final_total_uzs: validated.final_total_uzs,
        promo_code: validated.promo.code,
        applied_at: new Date().toISOString(),
      },
    });

    const nextRouteMeta = {
      ...(orderRow.route_meta || {}),
      promo: {
        code: validated.promo.code,
        promo_id: validated.promo.id,
        redemption_id: redemption.id,
        discount_uzs: validated.discount_uzs,
        final_total_uzs: validated.final_total_uzs,
        original_order_total_uzs: Number(orderRow.amount_uzs || orderTotalUzs),
        redemption_status: 'applied',
      },
    };

    await rewardService.repositories.serviceOrders.updateOrderPromoState({
      orderId,
      nextPriceUzs: validated.final_total_uzs,
      routeMeta: nextRouteMeta,
    });

    return json(res, 200, {
      ok: true,
      promo: validated.promo,
      redemption,
      discount_uzs: validated.discount_uzs,
      final_total_uzs: validated.final_total_uzs,
      order_id: orderId,
    });
  } catch (error) {
    return serverError(res, error);
  }
}
