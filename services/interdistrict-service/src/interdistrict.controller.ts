import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { InterDistrictTrip, DistrictBooking } from "./interdistrict.types";

export const interdistrictRouter = Router();

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Create trip (driver)
interdistrictRouter.post("/trip", async (req, res) => {
  try {
    const { data, error } = await sb.from("interdistrict_trips")
      .insert({ ...req.body, status: "open", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});

// List trips by route
interdistrictRouter.get("/trips", async (req, res) => {
  try {
    const { from_district, to_district } = req.query as Record<string, string>;
    const { data } = await sb.from("interdistrict_trips")
      .select("*")
      .eq("from_district", from_district)
      .eq("to_district", to_district)
      .eq("status", "open")
      .gt("seats_available", 0)
      .order("departure_time");
    res.json(data || []);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});

// Book seat
interdistrictRouter.post("/book", async (req, res) => {
  try {
    const { trip_id, user_id, seats, pickup_point } = req.body;
    const { data: trip } = await sb.from("interdistrict_trips").select("*").eq("id", trip_id).single();
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if ((trip as any).seats_available < seats) return res.status(400).json({ error: "Not enough seats" });
    const total = (trip as any).price_per_seat_uzs * seats;
    const { data, error } = await sb.from("interdistrict_bookings")
      .insert({ trip_id, user_id, seats, total_price_uzs: total, pickup_point, status: "confirmed", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    await sb.from("interdistrict_trips")
      .update({ seats_available: (trip as any).seats_available - seats }).eq("id", trip_id);
    res.json(data);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});

// My bookings
interdistrictRouter.get("/my/:userId", async (req, res) => {
  try {
    const { data } = await sb.from("interdistrict_bookings")
      .select("*, interdistrict_trips(*)")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false });
    res.json(data || []);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});

// Cancel booking
interdistrictRouter.patch("/booking/:id/cancel", async (req, res) => {
  try {
    const { data, error } = await sb.from("interdistrict_bookings")
      .update({ status: "canceled" }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});
