import { json, badRequest, serverError, nowIso } from "./_lib.js";
import { getSupabaseAdmin } from "./_supabase.js";

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const order_id = String(b.order_id || "").trim();
    const amount_uzs = Math.round(Number(b.amount_uzs || 0));

    if (!order_id) return badRequest(res, "order_id kerak");

    // Agar server env yo'q bo'lsa — demo javob
    if (!hasSupabaseEnv()) return json(res, 200, { ok: true, demo: true });

    const sb = getSupabaseAdmin();

    // Minimal update: orderga final_price_uzs yozib qo'yamiz
    const patch = { final_price_uzs: Number.isFinite(amount_uzs) && amount_uzs > 0 ? amount_uzs : null, updated_at: nowIso?.() };
    const { data, error } = await sb
      .from("orders")
      .update(patch)
      .eq("id", order_id)
      .select("id, final_price_uzs")
      .single();

    if (error) throw error;

    return json(res, 200, { ok: true, order: data });
  } catch (e) {
    return serverError(res, e);
  }
}
