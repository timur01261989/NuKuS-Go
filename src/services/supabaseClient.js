// Central Supabase client for services
// SINGLE source of truth: src/lib/supabase.js

import { supabase } from "../lib/supabase.js";

export function assertSupabase() {
  if (!supabase) throw new Error("Supabase client is not initialized");
  if (!supabase.auth) throw new Error("Supabase auth is not available");
  return supabase;
}

export { supabase };