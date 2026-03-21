import { Router } from "express";
import { DeliveryService } from "./delivery.service";

export const deliveryRouter = Router();
const svc = new DeliveryService();

deliveryRouter.post("/order",              async (req, res) => { try { res.json(await svc.createOrder(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
deliveryRouter.get("/order/:id",           async (req, res) => { try { res.json(await svc.getOrder(req.params.id)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
deliveryRouter.get("/my/:userId",          async (req, res) => { try { res.json(await svc.myActiveOrders(req.params.userId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
deliveryRouter.patch("/order/:id/accept",  async (req, res) => { try { res.json(await svc.accept(req.params.id, req.body.driver_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
deliveryRouter.patch("/order/:id/pickup",  async (req, res) => { try { res.json(await svc.pickup(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
deliveryRouter.patch("/order/:id/complete",async (req, res) => { try { res.json(await svc.complete(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
deliveryRouter.patch("/order/:id/cancel",  async (req, res) => { try { res.json(await svc.cancel(req.params.id, req.body.reason)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
