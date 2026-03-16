import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env.js";
import { getBearerToken } from "./http-auth.js";

let cachedAdmin = null;

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

export async function withAuth(req, _res) {
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
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }));
      return;
    }
    req.authUser = user;
    req.authUserId = user.id;
    req.supabaseAdmin = supabase;
    return handler(req, res, ...rest);
  };
}
