/**
 * api/notifications.js
 * Server-side Web Push yuborish.
 *
 * Endpoints:
 *   POST /api/notifications
 *   body: { user_id, title, body, url?, tag? }
 *        yoki { driver_id, title, body, url?, tag? }  (haydovchiga)
 *
 * Muhit o'zgaruvchilari (.env):
 *   VAPID_SUBJECT      mailto:admin@nukusgo.uz
 *   VAPID_PUBLIC_KEY   (npx web-push generate-vapid-keys dan)
 *   VAPID_PRIVATE_KEY  (npx web-push generate-vapid-keys dan)
 *
 * O'rnatish: npm install web-push
 */

import { json, badRequest, serverError } from "../_shared/cors.js";
import { getSupabaseAdmin } from "../_shared/supabase.js";

function hasEnv() {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendWebPush(subscription, payload) {
  // web-push paketini dynamic import qilamiz (optional dependency)
  let webPush;
  try {
    webPush = await import("web-push");
  } catch {
    throw new Error("web-push npm paketi o'rnatilmagan. npm install web-push qiling.");
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@nukusgo.uz",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
  if (!hasEnv()) return serverError(res, "VAPID yoki Supabase env sozlamalari yetishmayapti");

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const userId = String(body.user_id || body.driver_id || "").trim();
  const title = String(body.title || "Nukus Go").trim();
  const notifBody = String(body.body || "").trim();
  const url = String(body.url || "/").trim();
  const tag = String(body.tag || "nukusgo").trim();

  if (!userId) return badRequest(res, "user_id yoki driver_id kerak");
  if (!title && !notifBody) return badRequest(res, "title yoki body kerak");

  const sb = getSupabaseAdmin();

  // Foydalanuvchining barcha push subscriptionlarini olish
  const { data: subs, error: subErr } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (subErr) return serverError(res, subErr);
  if (!subs || subs.length === 0) {
    return json(res, 200, { ok: true, sent: 0, message: "Foydalanuvchida push subscription yo'q" });
  }

  const payload = {
    title,
    body: notifBody,
    url,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
  };

  let sent = 0;
  const expired = [];

  for (const sub of subs) {
    try {
      await sendWebPush(sub, payload);
      sent++;
    } catch (e) {
      // 410 = subscription muddati o'tgan — o'chiramiz
      if (e.statusCode === 410 || e.statusCode === 404) {
        expired.push(sub.endpoint);
      }
    }
  }

  // Muddati o'tgan subscriptionlarni tozalash
  if (expired.length > 0) {
    await sb.from("push_subscriptions").delete().in("endpoint", expired);
  }

  // notifications jadvaliga log yozish
  await sb.from("notifications").insert([{
    user_id: userId,
    title,
    body: notifBody,
    action_url: url,
    sent_at: new Date().toISOString(),
  }]);

  return json(res, 200, { ok: true, sent, expired: expired.length });
}
