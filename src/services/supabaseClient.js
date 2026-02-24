// Single source of truth: src/lib/supabase.js
import {
  supabase,
  getSessionOrNull,
  requireSession,
  onAuthStateChange,
} from '../lib/supabase.js';

export function assertSupabaseReady() {
  if (!supabase) throw new Error('Supabase client is not initialized');
  if (!supabase.auth) throw new Error('Supabase auth is not available');
  return supabase;
}

export { supabase, getSessionOrNull, requireSession, onAuthStateChange };