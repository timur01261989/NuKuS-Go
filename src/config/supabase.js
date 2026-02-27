import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId) => {
  // Prefer legacy `users` table if present, but do not crash if row is missing.
  {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // If a real error happened (not "0 rows"), surface it
    if (error && error.code !== 'PGRST116') throw error;
    if (data) return data;
  }

  // Fallback to `profiles`
  for (const key of ['id', 'user_id']) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq(key, userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (data) return data;
  }

  return null;
};

export const getDriverProfile = async (userId) => {
  const { data, error } = await supabase
    .from('driver_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export default supabase;
