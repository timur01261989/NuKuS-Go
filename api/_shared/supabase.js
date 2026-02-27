import { createClient } from '@supabase/supabase-js';

/**
 * Canonical Supabase Admin client for Vercel serverless.
 *
 * Supports multiple env naming variants used across the project:
 *  - SUPABASE_URL (preferred server)
 *  - VITE_SUPABASE_URL (fallback for older code)
 *
 *  - SUPABASE_SERVICE_ROLE_KEY (preferred server)
 *  - SUPABASE_SERVICE_KEY (older server)
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Supabase env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
