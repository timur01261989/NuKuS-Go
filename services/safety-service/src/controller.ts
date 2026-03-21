import { Router } from "express";
import { SafetyService } from "./safety.service";

export const safetyRouter = Router();
const svc = new SafetyService();

safetyRouter.post("/sos",                       async (req, res) => { try { const { order_id, user_id, driver_id, lat, lng } = req.body; res.json(await svc.triggerSOS(order_id, user_id, driver_id, lat, lng)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
safetyRouter.post("/checkin",                   async (req, res) => { try { res.json(await svc.processCheckIn(req.body)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
safetyRouter.patch("/alert/:id/resolve",        async (req, res) => { try { await svc.resolveAlert(req.params.id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
safetyRouter.get("/alerts/:orderId",            async (req, res) => { try { res.json(await svc.getAlerts(req.params.orderId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
safetyRouter.post("/trip-share",                async (req, res) => { try { res.json(await svc.createTripShare(req.body.order_id, req.body.user_id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
safetyRouter.get("/trip-share/:token",          async (req, res) => { try { res.json(await svc.getTripByToken(req.params.token)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
safetyRouter.post("/trusted-contact",           async (req, res) => { try { res.json(await svc.addTrustedContact(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
