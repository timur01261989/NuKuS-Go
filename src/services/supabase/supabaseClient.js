import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function assertSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const message =
      "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Vite environment variables must start with VITE_. " +
      "Configure the same keys in local .env and in deployment environment variables.";

    if (import.meta.env.DEV) {
      throw new Error(message);
    }

    console.error(message);
  }
}

assertSupabase();

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.supabase = supabase;
}

export default supabase;
