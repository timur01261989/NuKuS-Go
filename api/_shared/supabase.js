import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY topilmadi!');
  }

  // Admin klienti - RLS qoidalarini chetlab o'tadi
  return createClient(url, key, { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false 
    } 
  });
}