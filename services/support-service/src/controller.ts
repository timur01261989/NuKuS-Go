import { Router } from "express";
import { SupportService } from "./support.service";

export const supportRouter = Router();
const svc = new SupportService();

supportRouter.post("/ticket",                    async (req, res) => { try { const { user_id, category, subject, description, order_id } = req.body; res.json(await svc.createTicket(user_id, category, subject, description, order_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
supportRouter.get("/ticket/:id",                 async (req, res) => { try { const t = await svc.getTicket(req.params.id); if (!t) return res.status(404).json({ error: "Not found" }); res.json(t); } catch(e: any) { res.status(500).json({ error: e.message }); }});
supportRouter.post("/ticket/:id/message",        async (req, res) => { try { res.json(await svc.addMessage(req.params.id, req.body.sender_id, req.body.sender_role, req.body.content)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
supportRouter.post("/ticket/:id/resolve",        async (req, res) => { try { await svc.resolveTicket(req.params.id, req.body.agent_id, req.body.resolution); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
supportRouter.post("/ticket/:id/assign",         async (req, res) => { try { await svc.assignTicket(req.params.id, req.body.agent_id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
supportRouter.get("/user/:userId/tickets",       async (req, res) => { try { res.json(await svc.getUserTickets(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
supportRouter.get("/open",                       async (req, res) => { try { res.json(await svc.getOpenTickets(Number(req.query.limit) || 50)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
supportRouter.get("/stats",                      async (req, res) => { try { res.json(await svc.getStats()); } catch(e: any) { res.status(500).json({ error: e.message }); }});
