import { Router } from "express";
import { findBestDriver }  from "./algorithms/nearestDriver";
import { batchMatch }      from "./algorithms/optimalBatch";
import { calculateFairness } from "./algorithms/fairnessScore";

export const matchingRouter = Router();

matchingRouter.post("/find-driver", async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, service_type = "taxi" } = req.body;
    const result = await findBestDriver(pickup_lat, pickup_lng, service_type);
    res.json(result);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

matchingRouter.post("/batch-match", async (req, res) => {
  try {
    const { orders } = req.body;
    res.json(await batchMatch(orders));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

matchingRouter.get("/fairness/:driverId", async (req, res) => {
  try {
    res.json(await calculateFairness(req.params.driverId));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});
