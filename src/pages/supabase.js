import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY // yoki VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL yoki Key topilmadi! Vercel -> Settings -> Environment Variables ni tekshiring.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)
