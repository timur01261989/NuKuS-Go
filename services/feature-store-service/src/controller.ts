import { Router } from "express";
import { FeatureStoreService } from "./feature.store";

export const featureRouter = Router();
const svc = new FeatureStoreService();

featureRouter.get("/user/:userId",           async (req, res) => { try { res.json(await svc.getUserFeatures(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
featureRouter.get("/driver/:driverId",       async (req, res) => { try { res.json(await svc.getDriverFeatures(req.params.driverId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
featureRouter.get("/zone/:h3Cell",           async (req, res) => { try { const z = await svc.getZoneFeatures(req.params.h3Cell); res.json(z || {}); } catch(e: any) { res.status(500).json({ error: e.message }); }});
featureRouter.put("/zone/:h3Cell",           async (req, res) => { try { await svc.updateZoneFeatures(req.params.h3Cell, req.body); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
featureRouter.post("/batch/drivers",         async (req, res) => { try { res.json(await svc.batchGetDriverFeatures(req.body.driver_ids || [])); } catch(e: any) { res.status(500).json({ error: e.message }); }});
featureRouter.get("/predict/destination/:userId", async (req, res) => { try { const d = await svc.getPredictedDestination(req.params.userId, Number(req.query.lat), Number(req.query.lng)); res.json({ destination: d }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
