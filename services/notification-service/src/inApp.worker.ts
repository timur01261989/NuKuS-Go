import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface InAppNotification {
  user_id:   string;
  title:     string;
  body:      string;
  type:      "order" | "promo" | "system" | "chat" | "payment";
  action_url?: string;
  metadata?: Record<string, any>;
}

/** Store in-app notification in Supabase + broadcast via WS */
export async function sendInApp(notification: InAppNotification) {
  // 1. Persist to DB
  const { data, error } = await sb
    .from("in_app_notifications")
    .insert({
      user_id:    notification.user_id,
      title:      notification.title,
      body:       notification.body,
      type:       notification.type,
      action_url: notification.action_url,
      metadata:   notification.metadata,
      is_read:    false,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;

  // 2. Broadcast via Redis pub/sub (ws-gateway picks this up)
  const redis = await getRedisClient();
  await redis.publish(
    "notification:push:inapp",
    JSON.stringify({ ...notification, id: data.id, ts: new Date().toISOString() })
  );

  return data;
}

export async function markRead(userId: string, notificationId: string) {
  await sb
    .from("in_app_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function getUnread(userId: string, limit = 20) {
  const { data } = await sb
    .from("in_app_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

let redisClient: any;
async function getRedisClient() {
  if (!redisClient) {
    const { createClient } = await import("redis");
    redisClient = createClient({ url: `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}` });
    await redisClient.connect();
  }
  return redisClient;
}
