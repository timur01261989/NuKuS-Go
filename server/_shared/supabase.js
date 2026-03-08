import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY topilmadi!');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getBearerToken(req) {
  const h = req?.headers?.authorization || req?.headers?.Authorization || '';
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

export async function getAuthedUser(req, sb = null) {
  const token = getBearerToken(req);
  if (!token) return null;
  const client = sb || getSupabaseAdmin();
  const { data, error } = await client.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

export async function getAuthedUserId(req, sb = null) {
  const user = await getAuthedUser(req, sb);
  return user?.id || null;
}
