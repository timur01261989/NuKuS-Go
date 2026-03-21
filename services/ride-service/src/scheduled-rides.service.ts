import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface ScheduledRide {
  id:            string;
  user_id:       string;
  pickup:        { lat: number; lng: number; address: string };
  dropoff:       { lat: number; lng: number; address: string };
  scheduled_at:  string;    // ISO datetime
  service_type:  string;
  estimated_price_uzs: number;
  status:        "pending" | "searching" | "confirmed" | "cancelled" | "completed";
  order_id?:     string;
  reminder_sent: boolean;
  created_at:    string;
}

export class ScheduledRidesService {

  async schedule(data: Omit<ScheduledRide, "id" | "status" | "reminder_sent" | "created_at">): Promise<ScheduledRide> {
    const scheduledAt = new Date(data.scheduled_at);
    const now = new Date();

    if (scheduledAt.getTime() < now.getTime() + 15 * 60000)
      throw new Error("Kamida 15 daqiqa oldindan buyurtma qilish kerak");

    if (scheduledAt.getTime() > now.getTime() + 7 * 86400000)
      throw new Error("Maksimal 7 kun oldindan buyurtma qilish mumkin");

    const { data: ride, error } = await sb.from("scheduled_rides").insert({
      id: uuid(), ...data, status: "pending",
      reminder_sent: false, created_at: now.toISOString(),
    }).select().single();
    if (error) throw error;

    // Schedule reminder 30 min before
    const reminderAt = scheduledAt.getTime() - 30 * 60000;
    await sb.from("scheduled_reminders").insert({
      ride_id: ride.id, user_id: data.user_id,
      send_at: new Date(reminderAt).toISOString(), sent: false,
    });

    return ride as ScheduledRide;
  }

  async cancel(rideId: string, userId: string): Promise<void> {
    const { data } = await sb.from("scheduled_rides")
      .select("status, scheduled_at").eq("id", rideId).single();
    if (!data) throw new Error("Buyurtma topilmadi");

    const timeLeft = new Date((data as any).scheduled_at).getTime() - Date.now();
    if (timeLeft < 10 * 60000) throw new Error("Bekor qilish muddati o'tgan (10 daqiqagacha bekor qilish mumkin)");

    await sb.from("scheduled_rides").update({ status: "cancelled" })
      .eq("id", rideId).eq("user_id", userId);
  }

  async getUserScheduled(userId: string): Promise<ScheduledRide[]> {
    const { data } = await sb.from("scheduled_rides")
      .select("*").eq("user_id", userId)
      .in("status", ["pending", "searching", "confirmed"])
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at");
    return (data || []) as ScheduledRide[];
  }

  async getPendingToDispatch(): Promise<ScheduledRide[]> {
    const now   = new Date();
    const soon  = new Date(now.getTime() + 15 * 60000).toISOString();
    const { data } = await sb.from("scheduled_rides")
      .select("*").eq("status", "pending")
      .lte("scheduled_at", soon)
      .gte("scheduled_at", now.toISOString());
    return (data || []) as ScheduledRide[];
  }

  async dispatch(rideId: string): Promise<string> {
    const { data: ride } = await sb.from("scheduled_rides")
      .select("*").eq("id", rideId).single();
    if (!ride) throw new Error("Buyurtma topilmadi");

    // Create actual order
    const res = await fetch(`${process.env.RIDE_SERVICE_URL || "http://ride-service:3002"}/ride/order`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:    (ride as any).user_id,
        pickup:       (ride as any).pickup,
        dropoff:      (ride as any).dropoff,
        service_type: (ride as any).service_type,
        scheduled_ride_id: rideId,
      }),
    });
    const order = await res.json();

    await sb.from("scheduled_rides").update({
      status: "searching", order_id: order.id,
    }).eq("id", rideId);

    return order.id;
  }
}
