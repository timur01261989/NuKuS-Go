import { Router } from "express";
import { EarningsService } from "./earnings.service";

export const earningsRouter = Router();
const svc = new EarningsService();

earningsRouter.post("/record",              async (req, res) => { try { const { driver_id, order_id, gross_uzs, service_type, tips_uzs } = req.body; res.json(await svc.recordEarning(driver_id, order_id, gross_uzs, service_type, tips_uzs)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
earningsRouter.post("/bonus/:driverId",     async (req, res) => { try { await svc.addBonus(req.params.driverId, req.body.amount, req.body.reason); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
earningsRouter.get("/summary/:driverId",    async (req, res) => { try { res.json(await svc.getSummary(req.params.driverId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
earningsRouter.get("/breakdown/:driverId",  async (req, res) => { try { res.json(await svc.getDailyBreakdown(req.params.driverId, Number(req.query.days) || 30)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
