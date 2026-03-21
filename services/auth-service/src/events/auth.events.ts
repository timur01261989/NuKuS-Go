import { publishOne, USER_TOPICS } from "@unigo/event-bus";

export interface AuthEventPayload {
  user_id: string;
  phone?: string;
  action: "login" | "logout" | "register" | "otp_sent" | "otp_verified" | "token_refreshed";
  ip?: string;
  user_agent?: string;
  ts: number;
}

/**
 * Publish auth event to Kafka for analytics + fraud detection
 */
export async function publishAuthEvent(payload: AuthEventPayload): Promise<void> {
  try {
    await publishOne(USER_TOPICS.LOGGED_IN, payload, payload.user_id);
  } catch (e) {
    // Non-critical — log but don't throw
    console.error("[auth.events] publish failed:", e);
  }
}

export async function publishUserRegistered(payload: {
  user_id: string;
  phone: string;
  referral_code?: string;
}): Promise<void> {
  try {
    await publishOne(USER_TOPICS.REGISTERED, { ...payload, ts: Date.now() }, payload.user_id);
  } catch (e) {
    console.error("[auth.events] register publish failed:", e);
  }
}
