import { getSupabaseAdmin } from './supabase.js';
import { json } from './cors.js';

/**
 * Extract Bearer token and resolve user (Supabase Auth).
 * Returns { user, userId, userRow } or sends 401/404 and returns null.
 */
export async function requireAuth(req, res) {
  const token = req.headers?.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!token) {
    json(res, 401, { success:false, message:'No authentication token provided' });
    return null;
  }

  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(token);

  if (error || !user) {
    json(res, 401, { success:false, message:'Invalid or expired token' });
    return null;
  }

  // Fetch user row (base project expects `users` table)
  const { data: userRow, error: userError } = await sb
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (userError || !userRow) {
    json(res, 404, { success:false, message:'User not found' });
    return null;
  }

  return { user, userId: user.id, userRow, token };
}

export async function requireVerifiedDriver(req, res, authCtx) {
  const sb = getSupabaseAdmin();
  const { userId, userRow } = authCtx;

  if (!userRow || userRow.role !== 'driver') {
    json(res, 403, { success:false, message:'Driver access required' });
    return null;
  }

  const { data: profile, error } = await sb
    .from('driver_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle();

  if (error || !profile) {
    json(res, 403, { success:false, message:'Driver profile not verified' });
    return null;
  }

  return { ...authCtx, driverProfile: profile };
}
