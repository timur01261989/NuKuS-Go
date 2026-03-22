import { Router } from "express";
import { RatingService } from "./rating.service";

export const ratingRouter = Router();
const svc = new RatingService();

ratingRouter.post("/rate",                      async (req, res) => { try { const { order_id, from_id, to_id, from_role, stars, categories, comment, tags, is_anonymous } = req.body; res.json(await svc.submitRating(order_id, from_id, to_id, from_role, stars, categories || {}, comment, tags, is_anonymous)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
ratingRouter.get("/driver/:driverId/stats",     async (req, res) => { try { res.json(await svc.getDriverStats(req.params.driverId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
ratingRouter.post("/dispute/:ratingId",         async (req, res) => { try { await svc.disputeRating(req.params.ratingId, req.body.reason, req.body.disputer_id); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
ratingRouter.post("/dispute/:id/resolve",       async (req, res) => { try { await svc.resolveDispute(req.params.id, req.body.decision, req.body.admin_id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
ratingRouter.get("/tags/:role",                 (req, res) => { res.json({ positive: svc.getTagSuggestions(req.params.role as any, true), negative: svc.getTagSuggestions(req.params.role as any, false) }); });
