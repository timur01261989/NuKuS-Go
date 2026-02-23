/**
 * fcmService.js — Web Push Notifications (Service Worker orqali)
 *
 * Qanday ishlaydi:
 *  1. setupNotifications(userId) — brauzerdan ruxsat so'raydi + SW push subscription'ni oladi
 *  2. savePushSubscription() — subscription'ni Supabase push_subscriptions jadvaliga saqlaydi
 *  3. SW public/sw.js — "push" eventini qabul qilib, native notification ko'rsatadi
 *
 * Backend (api/notifications.js) VAPID orqali push yuboradi.
 *
 * VAPID kalitlarini olish:
 *   npx web-push generate-vapid-keys
 * Keyin .env ga qo'shing:
 *   VITE_VAPID_PUBLIC_KEY=your_public_key
 *   VAPID_PRIVATE_KEY=your_private_key   (faqat server tomonida)
 */

import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * URL-safe base64 ni Uint8Array ga aylantiradi (VAPID uchun kerak)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Push subscription'ni Supabase'ga saqlaydi
 * @param {PushSubscription} subscription
 * @param {string} userId
 */
async function savePushSubscription(subscription, userId) {
  if (!userId || !subscription) return;
  try {
    const subJson = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || "",
        auth: subJson.keys?.auth || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    );
    if (error) throw error;
  } catch {
    // Push subscription saqlanmasa ham ilova ishlayveradi
  }
}

/**
 * setupNotifications(userId?)
 * Chaqiriladigan joy: main.jsx — SW register bo'lgandan keyin
 *
 * @param {string|null} userId - Supabase user id (saqlash uchun)
 */
export async function setupNotifications(userId = null) {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    // Ruxsat olish
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return;

    // VAPID kaliti mavjud bo'lsa — push subscription olamiz
    if (!VAPID_PUBLIC_KEY) return;

    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) return;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Allaqachon obuna — faqat saqlang (userId yangi bo'lsa)
      if (userId) await savePushSubscription(existing, userId);
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    if (userId) await savePushSubscription(subscription, userId);
  } catch {
    // Push ruxsati rad etilganda yoki SW yo'qda — ilovaga ta'sir qilmaydi
  }
}

/**
 * unsubscribeNotifications()
 * Foydalanuvchi notificationlarni o'chirganda chaqiriladi
 */
export async function unsubscribeNotifications(userId = null) {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();

    if (userId) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", subscription.endpoint);
    }
  } catch {
    // ignore
  }
}

/**
 * showLocalNotification()
 * Offline push kerak bo'lmagan holatlarda brauzer ichida notification ko'rsatadi
 * (masalan: haydovchi onlayn bo'lib yangi offer kelganda)
 */
export function showLocalNotification(title, body, options = {}) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  } catch {
    // ignore
  }
}
