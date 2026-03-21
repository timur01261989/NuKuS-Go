import { Router } from "express";
import { FreightService } from "./freight.service";

export const freightRouter = Router();
const svc = new FreightService();

freightRouter.post("/cargo",                 async (req, res) => { try { res.json(await svc.createCargo(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.get("/cargo/:id",              async (req, res) => { try { res.json(await svc.getCargo(req.params.id)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
freightRouter.get("/my/:userId",             async (req, res) => { try { res.json(await svc.myOrders(req.params.userId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.get("/cargo/:id/match",        async (req, res) => { try { res.json(await svc.matchVehicles(req.params.id, Number(req.query.radius_km) || 30)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.patch("/cargo/:id/accept",     async (req, res) => { try { res.json(await svc.accept(req.params.id, req.body.driver_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.patch("/cargo/:id/transit",    async (req, res) => { try { res.json(await svc.startTransit(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.patch("/cargo/:id/complete",   async (req, res) => { try { res.json(await svc.complete(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
freightRouter.patch("/cargo/:id/cancel",     async (req, res) => { try { res.json(await svc.cancel(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
