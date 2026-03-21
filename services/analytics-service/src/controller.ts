import { Router } from "express";
import { eventCollector } from "./collectors/eventCollector";
import { getDashboardMetrics } from "./collectors/metricsCollector";

export const analyticsRouter = Router();

analyticsRouter.post("/track/order",    (req, res) => { eventCollector.trackOrder(req.body);    res.json({ ok: true }); });
analyticsRouter.post("/track/location", (req, res) => { eventCollector.trackLocation(req.body); res.json({ ok: true }); });
analyticsRouter.post("/track/payment",  (req, res) => { eventCollector.trackPayment(req.body);  res.json({ ok: true }); });

analyticsRouter.get("/dashboard", async (_, res) => {
  try {
    res.json(await getDashboardMetrics());
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

analyticsRouter.get("/heatmap", async (req, res) => {
  // Returns driver location density for map
  res.json({ points: [], message: "Heatmap requires ClickHouse + H3 setup" });
});
