/**
 * api/auth.js (Vercel serverless)
 *
 * Keeps the BASE project's auth working principle (Supabase Auth):
 *  - POST /api/v1/auth/register
 *  - POST /api/v1/auth/login
 *  - POST /api/v1/auth/verify-otp
 *  - POST /api/v1/auth/logout
 *  - POST /api/v1/auth/refresh
 *
 * Also supports shorter paths used by some screens:
 *  - POST /api/auth/login
 *  - POST /api/auth/register
 *  - POST /api/auth/verify-otp
 *  - POST /api/auth/refresh
 */
import { json, badRequest } from './_shared/cors.js';
import { getSupabaseAdmin } from './_shared/supabase.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
  try { return JSON.parse(raw); } catch { return {}; }
}

function phoneE164(phone) {
  const p = String(phone || '').trim();
  if (!p) return '';
  if (p.startsWith('+')) return p;
  // default Uzbekistan if user passes 9 digits
  if (/^\d{9}$/.test(p)) return `+998${p}`;
  if (/^998\d{9}$/.test(p)) return `+${p}`;
  return p;
}

function pathAfterApi(req) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname || '';
  // "/api/v1/auth/login" -> "v1/auth/login"
  const idx = p.indexOf('/api/');
  if (idx === -1) return p.replace(/^\/+/, '');
  return p.slice(idx + 5).replace(/^\/+/, '');
}

export default async function auth(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });

  const sb = getSupabaseAdmin();
  const body = await readBody(req);

  const subpath = pathAfterApi(req); // v1/auth/login
  const parts = subpath.split('/').filter(Boolean);
  const action = parts.slice(-1)[0] || '';

  // normalize when using "/api/auth/login"
  const last = action;

  try {
    if (req.method !== 'POST') return json(res, 405, { success:false, message:'Method not allowed' });

    if (last === 'register') {
      const { phone, password, fullName, role = 'client' } = body || {};
      if (!phone || !password) return badRequest(res, 'Phone and password are required');
      const e164 = phoneE164(phone);

      const { data: authData, error: authError } = await sb.auth.signUp({
        phone: e164,
        password,
        options: {
          data: { full_name: fullName, role }
        }
      });
      if (authError) return json(res, 400, { success:false, message: authError.message });

      // Create user row (BASE expects users table)
      const { data: userRow, error: userError } = await sb
        .from('users')
        .insert({
          id: authData.user?.id,
          phone,
          full_name: fullName,
          role
        })
        .select()
        .maybeSingle();

      if (userError) return json(res, 500, { success:false, message: userError.message });

      // Create wallet row if table exists
      try {
        await sb.from('wallets').insert({ user_id: userRow?.id, balance: 0 });
      } catch {}

      return json(res, 201, { success:true, data: { user: userRow, session: authData.session } });
    }

    if (last === 'login') {
      const { phone, password } = body || {};
      if (!phone || !password) return badRequest(res, 'Phone and password are required');
      const e164 = phoneE164(phone);

      const { data, error } = await sb.auth.signInWithPassword({ phone: e164, password });
      if (error) return json(res, 401, { success:false, message:'Invalid credentials' });

      const { data: userRow } = await sb.from('users').select('*').eq('id', data.user.id).maybeSingle();
      return json(res, 200, { success:true, data: { user: userRow, session: data.session } });
    }

    if (last === 'verify-otp') {
      const { phone, token } = body || {};
      if (!phone || !token) return badRequest(res, 'Phone and token are required');
      const e164 = phoneE164(phone);

      const { data, error } = await sb.auth.verifyOtp({ phone: e164, token, type: 'sms' });
      if (error) return json(res, 400, { success:false, message:'Invalid OTP' });

      return json(res, 200, { success:true, data });
    }

    if (last === 'logout') {
      // Supabase server-side signOut is session-based; keep compatibility response
      return json(res, 200, { success:true, message:'Logged out successfully' });
    }

    if (last === 'refresh') {
      const { refresh_token } = body || {};
      if (!refresh_token) return badRequest(res, 'Refresh token required');

      const { data, error } = await sb.auth.refreshSession({ refresh_token });
      if (error) return json(res, 401, { success:false, message:'Invalid refresh token' });

      return json(res, 200, { success:true, data });
    }

    // Fallback: allow /api/auth?action=login style
    const url = new URL(req.url, 'http://localhost');
    const qAction = url.searchParams.get('action') || body?.action;
    if (qAction === 'login') {
      req.url = '/api/v1/auth/login';
      return await auth(req, res);
    }

    return json(res, 404, { success:false, message:'Auth endpoint not found' });
  } catch (e) {
    return json(res, 500, { success:false, message: e?.message || 'Server error' });
  }
}
