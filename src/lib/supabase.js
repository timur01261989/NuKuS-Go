import { createClient } from "@supabase/supabase-js";

// 1. Kalitlarni olish
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Tekshirish (Xatolarni oldini olish uchun)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Diqqat! Supabase kalitlari topilmadi. .env faylini yoki Vercel sozlamalarini tekshiring.");
}

// 3. Klientni yaratish
export const supabase = createClient(supabaseUrl, supabaseAnonKey);