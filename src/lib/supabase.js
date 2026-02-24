import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-loud in dev, fail-soft in prod
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Check your .env (Vite requires VITE_ prefix) and restart the dev server."
  );
}

// TUZATILDI: || (yoki) belgisi qo'yildi
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// DEVda tekshirish uchun xohlasang ochib qo‘yasan, PRODda yopiq tursin
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.supabase = supabase;
}