import { Router } from "express";
import { IntercityRepository } from "./intercity.repository";

export const intercityRouter = Router();
const repo = new IntercityRepository();

intercityRouter.post("/trip",              async (req, res) => { try { res.json(await repo.createTrip(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
intercityRouter.get("/trips",              async (req, res) => { try { const { from_city, to_city, date } = req.query as any; res.json(await repo.listTrips(from_city, to_city, date)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
intercityRouter.get("/trip/:id",           async (req, res) => { try { const t = await repo.getTrip(req.params.id); if (!t) return res.status(404).json({ error: "Not found" }); res.json(t); } catch(e: any) { res.status(400).json({ error: e.message }); }});
intercityRouter.post("/book",              async (req, res) => { try { const { trip_id, user_id, seats } = req.body; res.json(await repo.book(trip_id, user_id, seats)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
intercityRouter.get("/my/:userId",         async (req, res) => { try { res.json(await repo.myBookings(req.params.userId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
intercityRouter.patch("/booking/:id/cancel",async (req, res) => { try { res.json(await repo.cancelBooking(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
