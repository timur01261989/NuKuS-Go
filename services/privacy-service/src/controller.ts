import { Router } from "express";
import { PrivacyService } from "./privacy.service";

export const privacyRouter = Router();
const svc = new PrivacyService();

privacyRouter.post("/export/:userId",              async (req, res) => { try { res.json(await svc.requestDataExport(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
privacyRouter.get("/export/:requestId/:userId",    async (req, res) => { try { res.json(await svc.getExport(req.params.requestId, req.params.userId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
privacyRouter.post("/delete/:userId",              async (req, res) => { try { res.json(await svc.requestDeletion(req.params.userId, req.body.reason)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
privacyRouter.delete("/delete/:userId/cancel",     async (req, res) => { try { await svc.cancelDeletion(req.params.userId); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
privacyRouter.get("/settings/:userId",             async (req, res) => { try { res.json(await svc.getPrivacySettings(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
privacyRouter.put("/settings/:userId",             async (req, res) => { try { await svc.updatePrivacySettings(req.params.userId, req.body); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
privacyRouter.post("/admin/execute-deletions",     async (req, res) => { try { const count = await svc.executeScheduledDeletions(); res.json({ deleted: count }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
