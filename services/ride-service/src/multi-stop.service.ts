import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface Stop {
  order:    number;
  lat:      number;
  lng:      number;
  address:  string;
  stop_duration_min?: number;  // How long to wait at stop
}

export interface MultiStopRide {
  id:            string;
  order_id:      string;
  user_id:       string;
  stops:         Stop[];
  current_stop:  number;
  total_price_uzs: number;
  status:        "active" | "completed" | "cancelled";
  created_at:    string;
}

export class MultiStopService {

  async createMultiStop(
    orderId: string, userId: string, stops: Stop[]
  ): Promise<MultiStopRide> {
    if (stops.length < 2) throw new Error("Kamida 2 ta to'xtalish joyi kerak");
    if (stops.length > 5) throw new Error("Maksimal 5 ta to'xtalish joyi mumkin");

    // Calculate total price
    let totalKm = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const dist = this._haversine(stops[i].lat, stops[i].lng, stops[i+1].lat, stops[i+1].lng);
      totalKm += dist;
    }
    const basePricePerKm = 2000; // 2000 so'm per km
    const stopFee        = (stops.length - 2) * 5000; // 5000 per extra stop
    const totalPrice     = Math.round(totalKm * basePricePerKm + stopFee);

    const { data, error } = await sb.from("multi_stop_rides").insert({
      id: uuid(), order_id: orderId, user_id: userId,
      stops: stops.sort((a, b) => a.order - b.order),
      current_stop: 0, total_price_uzs: totalPrice,
      status: "active", created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as MultiStopRide;
  }

  async advanceStop(multiStopId: string, driverId: string): Promise<{ next_stop: Stop | null; completed: boolean }> {
    const { data } = await sb.from("multi_stop_rides")
      .select("*").eq("id", multiStopId).single();
    if (!data) throw new Error("Multi-stop ride topilmadi");

    const ride  = data as MultiStopRide;
    const next  = ride.current_stop + 1;
    const stops = ride.stops as Stop[];

    if (next >= stops.length) {
      await sb.from("multi_stop_rides").update({ status: "completed", current_stop: stops.length - 1 }).eq("id", multiStopId);
      return { next_stop: null, completed: true };
    }

    await sb.from("multi_stop_rides").update({ current_stop: next }).eq("id", multiStopId);
    return { next_stop: stops[next], completed: false };
  }

  async getMultiStop(multiStopId: string): Promise<MultiStopRide | null> {
    const { data } = await sb.from("multi_stop_rides").select("*").eq("id", multiStopId).single();
    return data as MultiStopRide | null;
  }

  private _haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371, toR = (d: number) => d * Math.PI / 180;
    const dL = toR(lat2-lat1), dG = toR(lng2-lng1);
    return R*2*Math.atan2(Math.sqrt(Math.sin(dL/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2),Math.sqrt(1-(Math.sin(dL/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2)));
  }
}
