import { Router } from "express";
import { ChatService } from "./chat.service";

export const chatRouter = Router();
const svc = new ChatService();

chatRouter.post("/room",                   async (req, res) => { try { res.json(await svc.createRoom(req.body.order_id, req.body.client_id, req.body.driver_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
chatRouter.get("/room/:id",                async (req, res) => { try { const room = await svc.getRoom(req.params.id); if (!room) return res.status(404).json({ error: "Room not found" }); res.json(room); } catch(e: any) { res.status(500).json({ error: e.message }); }});
chatRouter.get("/room/:id/messages",       async (req, res) => { try { res.json(await svc.getMessages(req.params.id, Number(req.query.limit) || 50, req.query.before as string)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
chatRouter.post("/room/:id/message",       async (req, res) => { try { const { sender_id, sender_role, content, type, media_url } = req.body; res.json(await svc.sendMessage(req.params.id, sender_id, sender_role, content, type, media_url)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
chatRouter.post("/room/:id/read",          async (req, res) => { try { await svc.markRead(req.params.id, req.body.role); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
chatRouter.post("/room/:id/close",         async (req, res) => { try { await svc.closeRoom(req.params.id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
chatRouter.get("/quick-replies/:role",     (req, res) => { res.json(svc.getQuickReplies(req.params.role as any, req.query.lang as string)); });
chatRouter.post("/message/:id/report",     async (req, res) => { try { await svc.reportMessage(req.params.id, req.body.reporter_id, req.body.reason); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
