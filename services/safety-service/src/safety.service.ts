import { createClient } from "@supabase/supabase-js";
import { SafetyAlert, TrustedContact, TripShare, CheckIn, AlertType } from "./safety.types";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SMS_URL   = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3006";
const SPEED_LIMIT_KMH = 120;
const STOP_ALERT_MIN  = 10; // Alert if stopped > 10 min during ride

export class SafetyService {

  // ── SOS Alert ──────────────────────────────────────────────────
  async triggerSOS(
    orderId:  string,
    userId:   string,
    driverId: string,
    lat:      number,
    lng:      number
  ): Promise<SafetyAlert> {
    // Get trusted contacts
    const { data: contacts } = await sb.from("trusted_contacts")
      .select("*").eq("user_id", userId).eq("notify_on_sos", true);

    const notified: string[] = [];

    // Send SMS to all trusted contacts
    for (const contact of (contacts || [])) {
      try {
        await fetch(`${SMS_URL}/notify/sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone:   (contact as any).phone,
            message: `🆘 SOS! ${(contact as any).name || "Foydalanuvchi"} UniGo da yordam so'radi!
Joylashuv: https://maps.google.com/?q=${lat},${lng}
Buyurtma: ${orderId}`,
          }),
        });
        notified.push((contact as any).phone);
      } catch {}
    }

    // Notify internal support
    await fetch(`${SMS_URL}/notify/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "support-team",
        title: "🆘 SOS Alert!",
        body:  `Buyurtma ${orderId} da favqulodda vaziyat. Joylashuv: ${lat},${lng}`,
        data:  { type: "sos", order_id: orderId, lat, lng },
      }),
    }).catch(() => null);

    const { data: alert, error } = await sb.from("safety_alerts").insert({
      id: uuid(), order_id: orderId, user_id: userId, driver_id: driverId,
      type: "sos", status: "active", lat, lng,
      description: "Foydalanuvchi SOS tugmasini bosdi",
      contacts_notified: notified, created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return alert as SafetyAlert;
  }

  // ── Route Monitoring ───────────────────────────────────────────
  async processCheckIn(checkIn: CheckIn): Promise<{ alert?: SafetyAlert; warning?: string }> {
    // Speed check
    if (checkIn.speed_kmh > SPEED_LIMIT_KMH) {
      await this.createAlert(checkIn.order_id, "", checkIn.driver_id,
        "speed_violation", checkIn.lat, checkIn.lng,
        `Tezlik ${checkIn.speed_kmh} km/s — limitdan oshdi`);
      return { warning: `speed_violation:${checkIn.speed_kmh}` };
    }

    // Long stop detection
    const { data: lastMove } = await sb.from("driver_checkins")
      .select("ts, speed_kmh").eq("order_id", checkIn.order_id)
      .gt("speed_kmh", 5).order("ts", { ascending: false }).limit(1).single();

    if (lastMove) {
      const stopMinutes = (Date.now() - new Date((lastMove as any).ts).getTime()) / 60000;
      if (stopMinutes > STOP_ALERT_MIN) {
        const alert = await this.createAlert(
          checkIn.order_id, "", checkIn.driver_id,
          "long_stop", checkIn.lat, checkIn.lng,
          `Haydovchi ${Math.round(stopMinutes)} daqiqa to'xtab qoldi`);
        return { alert };
      }
    }

    // Store check-in
    await sb.from("driver_checkins").insert({
      order_id: checkIn.order_id, driver_id: checkIn.driver_id,
      lat: checkIn.lat, lng: checkIn.lng, speed_kmh: checkIn.speed_kmh, ts: checkIn.ts,
    });

    return {};
  }

  private async createAlert(
    orderId: string, userId: string, driverId: string,
    type: AlertType, lat: number, lng: number, desc: string
  ): Promise<SafetyAlert> {
    const { data, error } = await sb.from("safety_alerts").insert({
      id: uuid(), order_id: orderId, user_id: userId, driver_id: driverId,
      type, status: "active", lat, lng, description: desc,
      contacts_notified: [], created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as SafetyAlert;
  }

  async resolveAlert(alertId: string): Promise<void> {
    await sb.from("safety_alerts").update({
      status: "resolved", resolved_at: new Date().toISOString(),
    }).eq("id", alertId);
  }

  // ── Trip Sharing ───────────────────────────────────────────────
  async createTripShare(orderId: string, userId: string): Promise<TripShare> {
    const token    = uuid().replace(/-/g, "").slice(0, 16);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb.from("trip_shares").insert({
      id: uuid(), order_id: orderId, user_id: userId,
      share_token: token, expires_at: expiresAt, views: 0,
    }).select().single();
    if (error) throw error;
    return data as TripShare;
  }

  async getTripByToken(token: string): Promise<any> {
    const { data: share } = await sb.from("trip_shares")
      .select("*, orders(*)").eq("share_token", token)
      .gt("expires_at", new Date().toISOString()).single();
    if (!share) throw new Error("Havola topilmadi yoki muddati o'tgan");
    // Increment view count
    await sb.from("trip_shares").update({ views: (share as any).views + 1 }).eq("share_token", token);
    return share;
  }

  // ── Trusted Contacts ───────────────────────────────────────────
  async addTrustedContact(data: Omit<TrustedContact, "id" | "created_at">): Promise<TrustedContact> {
    const { data: contact, error } = await sb.from("trusted_contacts")
      .insert({ ...data, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return contact as TrustedContact;
  }

  async getAlerts(orderId: string): Promise<SafetyAlert[]> {
    const { data } = await sb.from("safety_alerts").select("*").eq("order_id", orderId)
      .order("created_at", { ascending: false });
    return (data || []) as SafetyAlert[];
  }
}
