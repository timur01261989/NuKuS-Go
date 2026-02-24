// NOTE: Keep ONE browser Supabase client for the whole app.
// This file re-exports the shared client from src/lib/supabase.js
// so existing imports keep working.

import { supabase as sharedSupabase, assertSupabase } from '../lib/supabase';

export const supabase = sharedSupabase;
export { assertSupabase };

// Optional helper for legacy code that expects default export
export default supabase;
