/**
 * server/api/fraud.js
 * Stage-6: Anti-fraud endpoints (SAFE / additive)
 *
 * POST /api/fraud  { action: "fingerprint", user_id, device_hash, platform?, meta? }
 * POST /api/fraud  { action: "flag", entity_type, entity_id, score, reason?, meta? }
 * GET  /api/fraud?action=list&entity_type=order&entity_id=... (admin/service role recommended)
 *
 * Writes are gated by FEATURE_ANTIFRAUD_WRITE=true.
 */

import { json, badRequest, serverError, nowIso } from "../_shared/cors.js";
import { getSupabaseAdmin, getAuthedUserId } from "../_shared/supabase.js";

function envTrue(name, defaultVal = false) {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") return defaultVal;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (!hasEnv()) return badRequest(res, "SUPABASE env yo'q");
    const sb = getSupabaseAdmin();

    const url = new URL(req.url, "http://localhost");
    const actionQ = url.searchParams.get("action");
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const action = String(body.action || actionQ || "").trim();

    if (String(req.method || "GET").toUpperCase() === "GET") {
      if (action !== "list") return badRequest(res, "action=list kerak");

      const entity_type = String(url.searchParams.get("entity_type") || "");
      const entity_id = String(url.searchParams.get("entity_id") || "");
      if (!entity_type || !entity_id) return badRequest(res, "entity_type va entity_id kerak");

      const { data, error } = await sb
        .from("fraud_flags")
        .select("*")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) return json(res, 200, { ok: false, error: error.message });
      return json(res, 200, { ok: true, flags: data || [] });
    }

    // Writes
    if (!envTrue("FEATURE_ANTIFRAUD_WRITE", false)) {
      return json(res, 200, { ok: false, skipped: true, reason: "FEATURE_ANTIFRAUD_WRITE disabled" });
    }

    if (action === "fingerprint") {
      const user_id = (await getAuthedUserId(req, sb)) || body.user_id;
      const device_hash = String(body.device_hash || "").trim();
      if (!user_id || !device_hash) return badRequest(res, "user_id va device_hash kerak");

      const row = {
        user_id,
        device_hash,
        platform: body.platform ?? null,
        first_seen: nowIso(),
        last_seen: nowIso(),
        meta: body.meta ?? null,
      };

      // Upsert by (user_id, device_hash) if unique exists
      const { error } = await sb
        .from("device_fingerprints")
        .upsert([row], { onConflict: "user_id,device_hash" });

      if (error) return json(res, 200, { ok: false, error: error.message });
      return json(res, 200, { ok: true });
    }

    if (action === "flag") {
      const entity_type = String(body.entity_type || "").trim();
      const entity_id = body.entity_id;
      const score = Number(body.score || 0);

      if (!entity_type || !entity_id) return badRequest(res, "entity_type va entity_id kerak");

      const row = {
        entity_type,
        entity_id,
        score,
        reason: body.reason ?? null,
        meta: body.meta ?? null,
        created_at: nowIso(),
      };

      const { error } = await sb.from("fraud_flags").insert([row]);
      if (error) return json(res, 200, { ok: false, error: error.message });
      return json(res, 200, { ok: true });
    }

    return badRequest(res, "action noto'g'ri");
  } catch (e) {
    return serverError(res, e);
  }
}
