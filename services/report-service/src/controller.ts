import { Router } from "express";
import { ReportService } from "./report.service";

export const reportRouter = Router();
const svc = new ReportService();

reportRouter.post("/daily",     async (req, res) => { try { const date = req.body.date || new Date().toISOString().slice(0,10); res.json(await svc.generateDailyOps(date)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
reportRouter.post("/weekly",    async (req, res) => { try { res.json(await svc.generateWeeklyRevenue()); } catch(e: any) { res.status(500).json({ error: e.message }); }});
reportRouter.get("/",           async (req, res) => { try { res.json(await svc.getReports(req.query.type as any, Number(req.query.limit) || 20)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
reportRouter.get("/:id",        async (req, res) => { try { const r = await svc.getReport(req.params.id); if (!r) return res.status(404).json({ error: "Not found" }); res.json(r); } catch(e: any) { res.status(500).json({ error: e.message }); }});
