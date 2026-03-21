import { Router } from "express";
import { MarketplaceRepository } from "./marketplace.repository";

export const marketplaceRouter = Router();
const repo = new MarketplaceRepository();

marketplaceRouter.post("/ad",           async (req, res) => { try { res.json(await repo.create(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
marketplaceRouter.get("/ads",           async (req, res) => { try { const { limit = 20, offset = 0, ...filters } = req.query as any; res.json(await repo.list(filters, Number(limit), Number(offset))); } catch(e: any) { res.status(400).json({ error: e.message }); }});
marketplaceRouter.get("/ad/:id",        async (req, res) => { try { const ad = await repo.findById(req.params.id); if (!ad) return res.status(404).json({ error: "Not found" }); res.json(ad); } catch(e: any) { res.status(400).json({ error: e.message }); }});
marketplaceRouter.get("/my/:sellerId",  async (req, res) => { try { res.json(await repo.myAds(req.params.sellerId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
marketplaceRouter.patch("/ad/:id/sold", async (req, res) => { try { res.json(await repo.markSold(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
marketplaceRouter.delete("/ad/:id",     async (req, res) => { try { await repo.delete(req.params.id, req.body.seller_id); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
