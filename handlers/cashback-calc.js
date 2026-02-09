import { json, badRequest, serverError } from './_lib.js';
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const final_price_uzs = Number(body.final_price_uzs||0);
    const service_type = String(body.service_type||'standard').toLowerCase();
    if (!Number.isFinite(final_price_uzs) || final_price_uzs <= 0) return badRequest(res, 'final_price_uzs noto‘g‘ri');
    let rate = 0.01;
    if (service_type === 'comfort') rate = 0.02;
    if (service_type === 'truck') rate = 0.0;
    return json(res, 200, { ok:true, cashback_uzs: Math.round(final_price_uzs * rate), rate });
  } catch (e) { return serverError(res, e); }
}
