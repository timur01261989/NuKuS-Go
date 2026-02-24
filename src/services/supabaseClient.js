// BUTUN APP UCHUN BIRTA SUPABASE CLIENT.
// Bu fayl yangi client yaratmaydi — faqat lib/supabase.js dagisini export qiladi.

import { supabase as sharedSupabase, assertSupabase } from "../lib/supabase";

export const supabase = sharedSupabase;
export { assertSupabase };
export default supabase;
