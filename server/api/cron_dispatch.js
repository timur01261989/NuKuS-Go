/**
 * api/cron_dispatch.js
 * GET /api/cron_dispatch
 * Vercel Cron (har 1 daqiqada) yoki Supabase pg_cron orqali chaqiriladi.
 *
 * Nima qiladi:
 *  1. "searching" statusdagi buyurtmalarni topadi
 *  2. dispatch_handler orqali haydovchilarga yuboradi
 *  3. Yangi offer qo'shilsa — haydovchiga Web Push yuboradi (VAPID)
 *
 * vercel.json'da cron sozlamasi (Vercel Pro kerak):
 *  "crons": [{ "path": "/api/cron_dispatch", "schedule": "* * * * *" }]
 *
 * Bepul alternativa — Supabase Dashboard > Integrations > pg_cron:
 *  SELECT cron.schedule('dispatch-cron', '* * * * *', $$SELECT net.http_post(...)$$);
 */

import { json, serverError } from "../_shared/cors.js";
import { getSupabaseAdmin } from "../_shared/supabase.js";
import { dispatch_handler } from "./dispatch.js";

// [import moved to top] import { json, serverError } from "../_shared/cors.js";
// [import moved to top] import { getSupabaseAdmin } from "../_shared/supabase.js";
// [import moved to top] import { dispatch_handler } from "./dispatch.js";

function hasSupabaseEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Haydovchiga Web Push yuborish (agar VAPID sozlangan bo'lsa)
 */
async function notifyDriverPush(sb, driverUserId, orderId) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  try {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", driverUserId);

    if (!subs || subs.length === 0) return;

    let webPush;
    try { webPush = await import("web-push"); } catch { return; }

    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@nukusgo.uz",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: "🚕 Yangi buyurtma!",
      body: "Buyurtmani qabul qilish uchun bosing",
      url: "/driver/dashboard",
      tag: `order-${String(orderId).slice(-6)}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [300, 100, 300],
      requireInteraction: true,
      actions: [
        { action: "accept", title: "Qabul qilish" },
        { action: "decline", title: "Rad etish" },
      ],
      acceptUrl: "/driver/dashboard",
    });

    const expired = [];
    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 30 }
        );
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) expired.push(sub.endpoint);
      }
    }

    if (expired.length > 0) {
      await sb.from("push_subscriptions").delete().in("endpoint", expired);
    }
  } catch {
    // push xatosi dispatch'ni to'xtatmasin
  }
}

export default async function handler(req, res) {
  try {
    if (!hasSupabaseEnv()) return serverError(res, "Server misconfigured: missing SUPABASE env");

    // Vercel Cron Authorization header tekshirish (xavfsizlik)
    const authHeader = req.headers?.authorization || "";
    const cronSecret = process.env.CRON_SECRET || "";
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return json(res, 401, { ok: false, error: "Unauthorized" });
    }

    const sb = getSupabaseAdmin();

    // Searching statusdagi buyurtmalar (max 50 ta, eski birinchi)
    const { data: orders, error } = await sb
      .from("orders")
      .select("id, status")
      .eq("status", "searching")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    let dispatched = 0;
    let pushed = 0;

    // Har bir order uchun — dispatchdan oldingi offer'larni eslab qolamiz
    const offersBefore = {};
    for (const o of orders || []) {
      const { data: existingOffers } = await sb
        .from("order_offers")
        .select("driver_user_id")
        .eq("order_id", o.id)
        .eq("status", "sent");
      offersBefore[o.id] = new Set((existingOffers || []).map((x) => x.driver_user_id));
    }

    // Dispatch qilish
    for (const o of orders || []) {
      const fakeReq = {
        method: "POST",
        url: "/api/dispatch",
        body: JSON.stringify({ order_id: String(o.id) }),
        headers: {},
      };
      const fakeRes = {
        statusCode: 200, _body: null,
        setHeader() {}, end(chunk) { this._body = chunk; },
      };
      await dispatch_handler(fakeReq, fakeRes);
      dispatched++;

      // Yangi offer qo'shildi? — Push yuborish
      const { data: newOffers } = await sb
        .from("order_offers")
        .select("driver_user_id")
        .eq("order_id", o.id)
        .eq("status", "sent");

      for (const offer of newOffers || []) {
        if (!offersBefore[o.id]?.has(offer.driver_user_id)) {
          await notifyDriverPush(sb, offer.driver_user_id, o.id);
          pushed++;
        }
      }
    }

    return json(res, 200, {
      ok: true,
      scanned: (orders || []).length,
      dispatched,
      push_sent: pushed,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return serverError(res, e?.message || String(e));
  }
}
