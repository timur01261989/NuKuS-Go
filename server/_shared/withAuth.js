import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function withAuth(req, res) {
  try {
    // ✅ FAQAT API ROUTELAR TEKSHIRILADI
    if (!req.url.startsWith("/api")) {
      return { ok: true, user: null };
    }

    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { ok: false, status: 401, message: "Invalid token" };
    }

    return { ok: true, user };
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return { ok: false, status: 500, message: "Auth failed" };
  }
}