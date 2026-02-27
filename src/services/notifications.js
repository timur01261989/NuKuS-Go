/**
 * notifications.js
 * setupNotifications() wrapper + Supabase Realtime notification listener
 */
import { setupNotifications as _setup, showLocalNotification } from "./fcmService";
import { supabase } from "@/lib/supabase";

export { showLocalNotification };

export async function setupNotifications(userId = null) {
  try {
    await _setup(userId);
  } catch {
    // notification bo'lmasa ham app ishlayversin
  }
}

/**
 * subscribeToMyNotifications()
 * Foydalanuvchiga kelgan notifications jadvalidagi yangi qatorlarni tinglaydi
 * va brauzer notification ko'rsatadi.
 *
 * @param {string} userId
 * @returns {Function} unsubscribe
 */
export function subscribeToMyNotifications(userId) {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`my-notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload?.new;
        if (!row) return;
        showLocalNotification(
          row.title || "Nukus Go",
          row.body || "",
          { data: { url: row.action_url || "/" } }
        );
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
