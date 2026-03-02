import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEVda qattiq, PRODda yumshoq xatolik
export function assertSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const msg =
      "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Vite .env o'zgaruvchilari VITE_ bilan boshlanishi shart. " +
      "Vercel'da ham Environment Variables'ga aynan shu nomlar bilan qo'ying.";
    if (import.meta.env.DEV) throw new Error(msg);
    console.error(msg);
  }
}

assertSupabase();

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage:
        typeof window !== "undefined" ? window.localStorage : undefined,
    },
  }
);

// DEBUG faqat DEVda
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.supabase = supabase;
}
