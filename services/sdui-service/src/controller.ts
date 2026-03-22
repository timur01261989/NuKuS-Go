import { Router } from "express";
import { SDUIService } from "./sdui.service";

export const sduiRouter = Router();
const svc = new SDUIService();

// Client: get screen layout
sduiRouter.get("/screen/:screenId", async (req, res) => {
  try {
    const { userId = "anon", region = "toshkent", lang = "uz_latn",
            version = "1.0.0", role = "client" } = req.query as Record<string, string>;
    res.json(await svc.getScreen(req.params.screenId, userId, region, lang, version, role));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Admin: create component
sduiRouter.post("/component",         async (req, res) => { try { res.json(await svc.createComponent(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});

// Admin: emergency broadcast
sduiRouter.post("/broadcast",         async (req, res) => { try { await svc.broadcastAlert(req.body.message, req.body.regions); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});

// Admin: deactivate
sduiRouter.delete("/component/:id",   async (req, res) => { try { await svc.deactivateComponent(req.params.id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});

// Admin: list
sduiRouter.get("/components",         async (req, res) => { try { res.json(await svc.listComponents(req.query.screen_id as string)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
