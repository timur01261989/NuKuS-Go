import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Serverless Function: /api/order
 * Method: POST
 *
 * Expect:
 *  - Authorization: Bearer <supabase_access_token>
 *  - JSON body: order data (fields you want to insert)
 *
 * This Variant A inserts as the authenticated user (RLS must allow it).
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getBearerToken(req) {
  const h = req.headers?.authorization  req.headers?.Authorization  "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: "Server misconfigured: missing SUPABASE_URL / SUPABASE_ANON_KEY in Vercel env",
    });
  }

  // 1) Token olish
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });

  // 2) Body tekshirish
  const body = req.body;
  if (!isObject(body)) {
    return res.status(400).json({ error: "Invalid JSON body (expected object)" });
  }

  // 3) Auth user tekshirish (token validmi?)
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: "Invalid/expired token", details: userErr?.message });
  }

  // 4) User nomidan DB insert (RLS ishlaydi)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: Bearer ${token},
      },
    },
  });

  // Minimal sanitization: user_id ni server qo‘ysin (clientdan kelgan bo‘lsa ham bosib ketamiz)
  const orderPayload = {
    ...body,
    user_id: userData.user.id,
  };

  try {
    const { data, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("*")
      .single();

    if (error) {
      // Bu yerda ko‘pincha RLS, column mismatch, required field yo‘qligi chiqadi
      return res.status(400).json({
        error: "Insert failed",
        details: error.message,
        hint: error.hint,
        code: error.code,
      });
    }

    return res.status(200).json({ ok: true, order: data });
  } catch (e) {
    return res.status(500).json({ error: "Server crash", details: String(e?.message || e) });
  }
}