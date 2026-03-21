import { Router } from "express";
import { ABTestingService } from "./ab.service";

export const abRouter = Router();
const svc = new ABTestingService();

abRouter.post("/experiment",                    async (req, res) => { try { res.json(await svc.createExperiment(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
abRouter.get("/experiments",                    async (req, res) => { try { res.json(await svc.listRunning()); } catch(e: any) { res.status(500).json({ error: e.message }); }});
abRouter.get("/experiment/:id/user/:userId",    async (req, res) => { try { const v = await svc.getVariantForUser(req.params.id, req.params.userId); if (!v) return res.status(404).json({ error: "No experiment" }); res.json(v); } catch(e: any) { res.status(500).json({ error: e.message }); }});
abRouter.post("/experiment/:id/track",          async (req, res) => { try { await svc.trackEvent(req.params.id, req.body.user_id, req.body.event, req.body.value); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
abRouter.get("/experiment/:id/results",         async (req, res) => { try { res.json(await svc.getResults(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
