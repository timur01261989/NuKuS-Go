import { Router } from "express";
import { PromoService } from "./promo.service";

export const promoRouter = Router();
const svc = new PromoService();

promoRouter.post("/campaign",                   async (req, res) => { try { res.json(await svc.createCampaign(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
promoRouter.get("/campaigns",                   async (req, res) => { try { res.json(await svc.getActiveCampaigns(req.query.service as string)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
promoRouter.get("/campaign/:id/stats",          async (req, res) => { try { res.json(await svc.getCampaignStats(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
promoRouter.post("/validate",                   async (req, res) => { try { const { code, user_id, order_amount, service_type } = req.body; res.json(await svc.validatePromoCode(code, user_id, order_amount, service_type)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
promoRouter.post("/apply",                      async (req, res) => { try { const { campaign_id, user_id, order_id, discount_uzs } = req.body; res.json(await svc.applyPromo(campaign_id, user_id, order_id, discount_uzs)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
