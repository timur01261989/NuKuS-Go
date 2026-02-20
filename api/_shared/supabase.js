import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase helpers for Vercel Functions (/api).
 *
 * IMPORTANT:
 * - Browser/React code must NOT import anything from /api.
 * - If SERVICE_ROLE is not provided, we fall back to ANON + forwarded user JWT (RLS applies).
 */

function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
}

export function getSupabase(req, { admin = false } = {}) {
  // Guard: never allow this file to be used in the browser bundle
  if (typeof window !== 'undefined') {
    throw new Error('api/_shared/supabase.js browserda ishlamasligi kerak (server-only).');
  }

  const url = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceKey = pickEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
  const anonKey = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

  if (!url) {
    throw new Error('SUPABASE_URL (yoki VITE_SUPABASE_URL) topilmadi!');
  }

  // Prefer service role only if explicitly requested AND available
  const key = admin && serviceKey ? serviceKey : anonKey;
  if (!key) {
    throw new Error(
      'Supabase key topilmadi! Server uchun SUPABASE_ANON_KEY yoki VITE_SUPABASE_ANON_KEY kerak. '
    );
  }

  // Forward user JWT to keep RLS working (if caller sends Authorization: Bearer <jwt>)
  const authHeader =
    (req?.headers?.authorization || req?.headers?.Authorization || '').toString();

  const headers = {};
  if (authHeader) headers['Authorization'] = authHeader;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers,
    },
  });
}

// Backward-compat for older code paths
export function getSupabaseAdmin() {
  const url = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = pickEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');

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
