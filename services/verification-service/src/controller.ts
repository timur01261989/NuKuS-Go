import { Router } from "express";
import { VerificationService } from "./verification.service";

export const verificationRouter = Router();
const svc = new VerificationService();

verificationRouter.post("/document",              async (req, res) => { try { const { driver_id, type, file_url, expires_at } = req.body; res.json(await svc.submitDocument(driver_id, type, file_url, expires_at)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
verificationRouter.get("/driver/:driverId",       async (req, res) => { try { res.json(await svc.getVerificationStatus(req.params.driverId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
verificationRouter.patch("/document/:id/review",  async (req, res) => { try { const { status, reviewer_id, reason } = req.body; res.json(await svc.reviewDocument(req.params.id, status, reviewer_id, reason)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
verificationRouter.post("/inspection",            async (req, res) => { try { const { driver_id, vehicle_id, items, notes } = req.body; res.json(await svc.submitVehicleInspection(driver_id, vehicle_id, items, notes)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
verificationRouter.get("/pending",                async (req, res) => { try { res.json(await svc.getPendingReviews(Number(req.query.limit) || 20)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
verificationRouter.post("/block/:driverId",       async (req, res) => { try { await svc.blockDriver(req.params.driverId, req.body.reason); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
