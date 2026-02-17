import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DIAGNOSTIKA: Konsolga tekshiruv natijasini chiqaramiz
console.log("--- SUPABASE TEKSHIRUVI ---");
console.log("URL:", supabaseUrl ? "✅ URL Mavjud" : "❌ URL YO'Q (Undefined)");
console.log("Key:", supabaseAnonKey ? "✅ Kalit Mavjud" : "❌ Kalit YO'Q (Undefined)");

// Agar kalitlar yo'q bo'lsa, xabar beramiz
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("DIQQAT! Supabase kalitlari topilmadi. .env fayl yoki Vercel sozlamalarini tekshiring.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", // Xatolik bo'lmasligi uchun vaqtincha
  supabaseAnonKey || "placeholder-key"
);