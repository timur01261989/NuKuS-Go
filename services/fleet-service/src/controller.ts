import { Router } from "express";
import { FleetService } from "./fleet.service";

export const fleetRouter = Router();
const svc = new FleetService();

fleetRouter.post("/vehicle",                   async (req, res) => { try { res.json(await svc.registerVehicle(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
fleetRouter.get("/driver/:driverId",           async (req, res) => { try { res.json(await svc.getDriverVehicles(req.params.driverId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
fleetRouter.patch("/vehicle/:id/mileage",      async (req, res) => { try { await svc.updateMileage(req.params.id, req.body.mileage_km); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
fleetRouter.post("/vehicle/:id/inspect",       async (req, res) => { try { res.json(await svc.submitInspection(req.params.id, req.body.type, req.body.items, req.body.mileage_km, req.body.notes)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
fleetRouter.post("/vehicle/:id/verify",        async (req, res) => { try { await svc.verifyVehicle(req.params.id, req.body.admin_id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
fleetRouter.get("/expiring",                   async (req, res) => { try { res.json(await svc.checkExpiring(Number(req.query.days) || 30)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
fleetRouter.get("/stats",                      async (req, res) => { try { res.json(await svc.getFleetStats()); } catch(e: any) { res.status(500).json({ error: e.message }); }});
