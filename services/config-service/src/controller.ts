import { Router } from "express";
import { ConfigService } from "./config.service";

export const configRouter = Router();
const svc = new ConfigService();

configRouter.get("/all",          async (req, res) => { try { res.json(await svc.getAll(req.query.prefix as string)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
configRouter.get("/:key",         async (req, res) => { try { const v = await svc.get(req.params.key); if (v === null) return res.status(404).json({ error: "Config not found" }); res.json({ key: req.params.key, value: v }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
configRouter.put("/:key",         async (req, res) => { try { await svc.set(req.params.key, req.body.value, req.body.updated_by); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
configRouter.post("/init",        async (req, res) => { try { await svc.initDefaults(); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
