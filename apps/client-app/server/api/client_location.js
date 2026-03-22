import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { createClientLocationRepository } from '../repositories/clientLocationRepository.js';

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const sb = getSupabaseAdmin();
    const userId = await getAuthedUserId(req, sb);
    if (!userId) return badRequest(res, 'Auth kerak');

    const body = readBody(req);
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return badRequest(res, 'lat va lng kerak');
    }

    const accuracyM = body.accuracy_m != null ? Number(body.accuracy_m) : (body.accuracy != null ? Number(body.accuracy) : null);

    const repo = createClientLocationRepository(sb);
    const row = await repo.upsertLastLocation({
      userId,
      lat,
      lng,
      accuracyM: Number.isFinite(accuracyM) ? accuracyM : null,
    });

    return json(res, 200, { ok: true, location: row });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}
