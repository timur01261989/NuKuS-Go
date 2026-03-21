import { createClient } from "@supabase/supabase-js";
import { IntercityTrip, SeatBooking, TripStatus } from "./intercity.types";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class IntercityRepository {
  async createTrip(data: Omit<IntercityTrip, "id" | "status" | "created_at">): Promise<IntercityTrip> {
    const { data: trip, error } = await sb
      .from("intercity_trips")
      .insert({ ...data, status: "open", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return trip as IntercityTrip;
  }

  async listTrips(from_city: string, to_city: string, date?: string): Promise<IntercityTrip[]> {
    let q = sb.from("intercity_trips").select("*")
      .eq("from_city", from_city)
      .eq("to_city", to_city)
      .eq("status", "open")
      .gt("seats_available", 0)
      .order("departure_time", { ascending: true });
    if (date) q = q.gte("departure_time", date).lt("departure_time", date + "T23:59:59");
    const { data } = await q;
    return (data || []) as IntercityTrip[];
  }

  async book(trip_id: string, user_id: string, seats: number): Promise<SeatBooking> {
    const trip = await this.getTrip(trip_id);
    if (!trip) throw new Error("Trip not found");
    if (trip.seats_available < seats) throw new Error("Not enough seats");

    const total = trip.price_per_seat_uzs * seats;
    const { data: booking, error } = await sb
      .from("intercity_bookings")
      .insert({ trip_id, user_id, seats, total_price_uzs: total, status: "confirmed", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;

    await sb.from("intercity_trips")
      .update({ seats_available: trip.seats_available - seats })
      .eq("id", trip_id);

    return booking as SeatBooking;
  }

  async getTrip(id: string): Promise<IntercityTrip | null> {
    const { data } = await sb.from("intercity_trips").select("*").eq("id", id).single();
    return data as IntercityTrip | null;
  }

  async myBookings(userId: string): Promise<SeatBooking[]> {
    const { data } = await sb.from("intercity_bookings").select("*, intercity_trips(*)").eq("user_id", userId).order("created_at", { ascending: false });
    return (data || []) as SeatBooking[];
  }

  async cancelBooking(bookingId: string): Promise<SeatBooking> {
    const { data, error } = await sb.from("intercity_bookings").update({ status: "canceled" }).eq("id", bookingId).select().single();
    if (error) throw error;
    return data as SeatBooking;
  }
}
