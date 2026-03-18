import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env.js";
import { getBearerToken } from "./http-auth.js";

let cachedAdmin = null;

function writeUnauthorized(res, status = 401, message = "Unauthorized") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ok: false, error: message, code: "UNAUTHORIZED" }));
}

export function getSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin;
  const env = getServerEnv();
  cachedAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedAdmin;
}

export async function getAuthedUser(req, sb = null) {
  const token = getBearerToken(req);
  if (!token) return null;
  const supabase = sb || getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getAuthedUserId(req, sb = null) {
  const user = await getAuthedUser(req, sb);
  return user?.id || null;
}

/**
 * Compatibility helper.
 *
 * Supported forms:
 *   1) await withAuth(req, res) -> { ok, user, status, message }
 *   2) export default withAuth(handler) -> wraps handler and injects auth context
 */
export function withAuth(arg1, arg2) {
  if (typeof arg1 === "function") {
    const handler = arg1;
    return async function wrapped(req, res, ...rest) {
      try {
        const supabase = getSupabaseAdmin();
        const user = await getAuthedUser(req, supabase);
        if (!user) {
          writeUnauthorized(res, 401, "Unauthorized");
          return;
        }
        req.authUser = user;
        req.authUserId = user.id;
        req.supabaseAdmin = supabase;
        return await handler(req, res, ...rest);
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: error?.message || "Auth failed", code: "AUTH_FAILED" }));
      }
    };
  }

  const req = arg1;
  return (async () => {
    try {
      if (!req?.url?.startsWith("/api")) {
        return { ok: true, user: null };
      }
      const user = await getAuthedUser(req);
      if (!user) {
        return { ok: false, status: 401, message: "Unauthorized" };
      }
      return { ok: true, user };
    } catch (error) {
      return { ok: false, status: 500, message: error?.message || "Auth failed" };
    }
  })();
}

export function optionalAuth(handler) {
  return async function wrapped(req, res, ...rest) {
    const supabase = getSupabaseAdmin();
    req.authUser = await getAuthedUser(req, supabase);
    req.authUserId = req.authUser?.id || null;
    req.supabaseAdmin = supabase;
    return handler(req, res, ...rest);
  };
}

export function requireAuth(handler) {
  return async function wrapped(req, res, ...rest) {
    const supabase = getSupabaseAdmin();
    const user = await getAuthedUser(req, supabase);
    if (!user) {
      writeUnauthorized(res, 401, "Unauthorized");
      return;
    }
    req.authUser = user;
    req.authUserId = user.id;
    req.supabaseAdmin = supabase;
    return handler(req, res, ...rest);
  };
}
