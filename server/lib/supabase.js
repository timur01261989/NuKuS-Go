import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase helpers.
 * - Admin client uses SERVICE ROLE key (bypasses RLS) => MUST validate auth manually.
 * - Anon client uses ANON key and can be used for token validation via auth.getUser().
 */

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || mustEnv("SUPABASE_URL");
}

export function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || mustEnv("SUPABASE_ANON_KEY");
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || mustEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function createAnonClient() {
  const url = getSupabaseUrl();
  const anon = getAnonKey();
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAdminClient() {
  const url = getSupabaseUrl();
  const service = getServiceRoleKey();
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Extract bearer token from request headers.
 */
export function getBearerToken(req) {
  const h = req?.headers?.authorization || req?.headers?.Authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/**
 * Validate user access token using Supabase Auth.
 * Returns: { user, error }
 */
export async function getUserFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return { user: null, error: new Error("Missing Authorization: Bearer <token>") };

  const anonClient = createAnonClient();
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: error || new Error("Invalid token") };

  return { user: data.user, error: null };
}
