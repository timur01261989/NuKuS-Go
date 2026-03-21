import { Router } from "express";
import { FoodRepository } from "./food.repository";

export const foodRouter = Router();
const repo = new FoodRepository();

foodRouter.get("/restaurants",          async (req, res) => { try { res.json(await repo.listRestaurants(req.query.city as string)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
foodRouter.get("/restaurant/:id/menu",  async (req, res) => { try { res.json(await repo.getMenu(req.params.id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
foodRouter.post("/order",               async (req, res) => { try { res.json(await repo.createOrder(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
foodRouter.patch("/order/:id/status",   async (req, res) => { try { res.json(await repo.updateStatus(req.params.id, req.body.status, req.body.courier_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
foodRouter.get("/my/:userId",           async (req, res) => { try { res.json(await repo.myOrders(req.params.userId)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
