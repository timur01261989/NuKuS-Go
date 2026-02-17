import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  // Backendda (Serverda) process.env ishlatiladi
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Server Xatosi: SUPABASE_URL yoki SERVICE_ROLE_KEY topilmadi!');
  }

  // Admin klienti - RLS qoidalarini chetlab o\'tadi (faqat serverda ishlating!)
  return createClient(url, key, { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false 
    } 
  });
}