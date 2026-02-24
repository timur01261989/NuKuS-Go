import { createClient } from '@supabase/supabase-js';

// Vite (Vercel) uchun eng to‘g‘ri nomlar:
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Bu chiqsa: Vercel Environment Variables qo‘yilmagan yoki noto‘g‘ri nomlangan
  console.warn(
    '[Supabase] Missing env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel/Vite.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nukus_go_auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'nukus-go-web',
    },
  },
});

// DevTools’da: await supabase.auth.getSession() ko‘rish uchun
if (import.meta.env.DEV) {
  globalThis.supabase = supabase;
}

export async function getSessionOrNull() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Supabase] getSession error:', error.message);
      return null;
    }
    return data?.session ?? null;
  } catch (e) {
    console.warn('[Supabase] getSession exception:', e);
    return null;
  }
}

export async function requireSession() {
  const session = await getSessionOrNull();
  if (!session) {
    throw new Error('Not authenticated: session is null');
  }
  return session;
}

export function onAuthStateChange(handler) {
  // handler: (event, session) => void
  return supabase.auth.onAuthStateChange((event, session) => {
    try {
      handler?.(event, session ?? null);
    } catch (e) {
      console.warn('[Supabase] onAuthStateChange handler error:', e);
    }
  });
}