// server/api/voip.js
// Professional VOIP (Agora) + legacy log-only mode.
//
// SAFE / additive:
// - If FEATURE_VOIP_AGORA !== 'true' OR env keys missing -> behaves like legacy: returns placeholder channel, logs only.
// - If enabled and env keys present -> returns Agora RTC token for Web SDK (audio-only).
//
// Endpoints:
// - POST /api/voip/start { order_id?, caller_role?, caller_id?, callee_role?, callee_id?, provider? } -> session
// - POST /api/voip/end   { log_id, ended_at?, duration_sec? } -> closes log
// - GET  /api/voip/ping  -> ok
//
import { getSupabaseAdmin } from "../_shared/supabase.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function nowIso() {
  return new Date().toISOString();
}

function randomChannel(prefix = "unigo") {
  const r = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${r}`;
}

async function safeInsertLog(sb, row) {
  try {
    const { data, error } = await sb.from("voip_call_logs").insert(row).select("*").single();
    if (error) throw error;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function safeUpdateLog(sb, log_id, patch) {
  try {
    const { data, error } = await sb.from("voip_call_logs").update(patch).eq("id", log_id).select("*").single();
    if (error) throw error;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function isAgoraEnabled() {
  return String(process.env.FEATURE_VOIP_AGORA || "").toLowerCase() === "true";
}

async function buildAgoraToken({ channel, uid, role }) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return { ok: false, error: "Missing AGORA_APP_ID/AGORA_APP_CERTIFICATE." };
  }

  // Lazy import to avoid bundling issues if dependency missing in some env.
  let RtcTokenBuilder, RtcRole;
  try {
    const mod = await import("agora-access-token");
    RtcTokenBuilder = mod.RtcTokenBuilder;
    RtcRole = mod.RtcRole;
  } catch (e) {
    return { ok: false, error: "Missing dependency: agora-access-token. Install dependencies and redeploy." };
  }

  const expireSeconds = 60 * 20; // 20 minutes token
  const now = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = now + expireSeconds;

  const agoraRole = role === "caller" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, uid, agoraRole, privilegeExpiredTs);

  return {
    ok: true,
    app_id: appId,
    token,
    expires_at: new Date(privilegeExpiredTs * 1000).toISOString(),
  };
}

export default async function handler(req, res) {
  try {
    const method = req.method || "GET";
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname || "";
    const action = pathname.split("/").pop(); // start | end | ping

    if (method === "GET" && (action === "ping" || url.searchParams.get("action") === "ping")) {
      return json(res, 200, { ok: true, provider: "voip" });
    }

    // Parse body (Vercel Node)
    let body = {};
    if (method === "POST") {
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      } catch {
        body = req.body || {};
      }
    }

    const sb = getSupabaseAdmin();

    if (method === "POST" && action === "start") {
      const provider = (body.provider || "agora").toLowerCase();
      const order_id = body.order_id || null;
      const caller_role = body.caller_role || null;
      const caller_id = body.caller_id || null;
      const callee_role = body.callee_role || null;
      const callee_id = body.callee_id || null;

      const channel = body.channel || randomChannel("unigo_call");
      const uid = body.uid ? Number(body.uid) : Math.floor(Math.random() * 200000) + 1;

      // Insert log best-effort (does not block call)
      const logRow = {
        provider,
        order_id,
        caller_role,
        caller_id,
        callee_role,
        callee_id,
        room_id: channel,
        started_at: nowIso(),
        meta: { requested_provider: provider },
      };
      const logIns = await safeInsertLog(sb, logRow);
      const log_id = logIns.ok ? logIns.data.id : null;

      // If Agora enabled, return token
      if (provider === "agora" && isAgoraEnabled()) {
        const tokenRes = await buildAgoraToken({ channel, uid, role: "caller" });
        if (tokenRes.ok) {
          return json(res, 200, {
            ok: true,
            provider: "agora",
            app_id: tokenRes.app_id,
            channel,
            token: tokenRes.token,
            uid,
            log_id,
            expires_at: tokenRes.expires_at,
            log_write_ok: logIns.ok,
          });
        }
        // fall back to placeholder but keep log
        return json(res, 200, {
          ok: false,
          provider: "agora",
          channel,
          uid,
          log_id,
          error: tokenRes.error,
          log_write_ok: logIns.ok,
        });
      }

      // Legacy: placeholder session
      return json(res, 200, {
        ok: true,
        provider,
        channel,
        uid,
        token: null,
        app_id: process.env.AGORA_APP_ID || null,
        log_id,
        log_write_ok: logIns.ok,
        note: "VOIP provider not enabled; returned placeholder session.",
      });
    }

    if (method === "POST" && action === "end") {
      const log_id = body.log_id;
      if (!log_id) return json(res, 400, { ok: false, error: "log_id required" });

      const ended_at = body.ended_at || nowIso();
      const duration_sec = typeof body.duration_sec === "number" ? body.duration_sec : null;

      const upd = await safeUpdateLog(sb, log_id, { ended_at, duration_sec });
      return json(res, 200, { ok: true, updated: upd.ok, data: upd.ok ? upd.data : null, error: upd.ok ? null : upd.error });
    }

    return json(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    return json(res, 500, { ok: false, error: e?.message || String(e) });
  }
}
