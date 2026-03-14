import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getAuthedContext } from '../_shared/rewards.js';
import { getServiceOrderBySource, processCompletedServiceOrder } from '../_shared/rewardEngine.js';

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
    const body = await readBody(req);
    const action = String(body.action || 'process_completed_order').trim().toLowerCase();
    const sourceTable = String(body.source_table || 'orders').trim();
    const sourceId = String(body.order_id || body.source_id || '').trim();

    if (!userId) return json(res, 401, { ok: false, error: 'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (action !== 'process_completed_order') return badRequest(res, 'action noto\'g\'ri');
    if (!sourceId) return badRequest(res, 'order_id yoki source_id kerak');

    const serviceOrder = await getServiceOrderBySource(sb, { sourceTable, sourceId });
    if (!serviceOrder) return badRequest(res, 'Service order topilmadi');
    if (String(serviceOrder.user_id) !== String(userId)) {
      return json(res, 403, { ok: false, error: 'Bu service order sizga tegishli emas' });
    }

    const result = await processCompletedServiceOrder(sb, serviceOrder);
    return json(res, 200, {
      ok: true,
      source_table: sourceTable,
      source_id: sourceId,
      ...result,
    });
  } catch (error) {
    return serverError(res, error);
  }
}
