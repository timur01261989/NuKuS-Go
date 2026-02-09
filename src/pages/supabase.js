import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Agar URL yoki KEY bo'sh bo'lsa, xato bermasligi uchun tekshiruv
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL yoki Anon Key topilmadi! Secrets bo'limini tekshiring.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})