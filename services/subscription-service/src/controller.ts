import { Router } from "express";
import { SubscriptionService } from "./subscription.service";

export const subscriptionRouter = Router();
const svc = new SubscriptionService();

subscriptionRouter.get("/plans",                     (_, res) => res.json(svc.getPlans()));
subscriptionRouter.get("/plans/:planId",             (req, res) => { try { res.json(svc.getPlan(req.params.planId as any)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
subscriptionRouter.get("/user/:userId",              async (req, res) => { try { res.json(await svc.getUserSubscription(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
subscriptionRouter.post("/subscribe",                async (req, res) => { try { const { user_id, plan_id, billing, payment_method_id } = req.body; res.json(await svc.subscribe(user_id, plan_id, billing, payment_method_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
subscriptionRouter.post("/trial/:userId",            async (req, res) => { try { res.json(await svc.startTrial(req.params.userId, req.body.plan_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
subscriptionRouter.delete("/user/:userId",           async (req, res) => { try { await svc.cancel(req.params.userId); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
subscriptionRouter.post("/apply-discount",           async (req, res) => { try { const { user_id, base_price, service_type } = req.body; res.json(await svc.applyDiscount(user_id, base_price, service_type)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
subscriptionRouter.post("/family/:userId",           async (req, res) => { try { await svc.addFamilyMember(req.params.userId, req.body.member_id); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
