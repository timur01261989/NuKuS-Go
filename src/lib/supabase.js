import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * DEVda: env yo'q bo'lsa xatoni tashlaydi (darrov bilinadi)
 * PRODda: xatoni console.error qiladi (deploy yiqilmasin)
 */
function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const msg =
      "[Supabase] Missing env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. " +
      "Vite env o'zgaruvchilari VITE_ bilan boshlanishi shart. " +
      "Vercel Environment Variables'da ham aynan shu nomlar bilan qo'ying.";
    if (import.meta.env.DEV) throw new Error(msg);
    console.error(msg);
    return false;
  }
  return true;
}

const hasEnv = assertSupabaseEnv();

export const supabase = createClient(
  hasEnv ? supabaseUrl : "",
  hasEnv ? supabaseAnonKey : "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  }
);

export default supabase;