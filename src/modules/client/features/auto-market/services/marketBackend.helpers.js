import { supabase } from "@/services/supabase/supabaseClient.js";

export const SB_READY =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isMissingRelationError(err) {
  const msg = (err && (err.message || err.error_description || err.details)) || "";
  return (
    String(msg).toLowerCase().includes("does not exist") ||
    String(msg).toLowerCase().includes("relation") ||
    String(msg).toLowerCase().includes("42p01")
  );
}

export async function getAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id || null;
}

export function normalizeAdRow(row) {
  if (!row) return row;
  const images = (row.images || []).map((x) => x.url || x.image_url).filter(Boolean);
  return {
    ...row,
    images,
    seller: row.seller || {
      name: row.seller_name || "",
      phone: row.seller_phone || "",
      rating: row.seller_rating || null,
    },
  };
}
