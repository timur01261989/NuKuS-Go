import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../config/env.js";

// Keep behavior: fail fast if env is missing (same as before)
const supabaseUrl = requireEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = requireEnv("VITE_SUPABASE_ANON_KEY");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
