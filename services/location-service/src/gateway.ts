import express from "express";
import { RedisGeo } from "./redis";
import { SpatialService } from "./spatial";

export const locationRouter = express.Router();
const geo = new RedisGeo();
const spatial = new SpatialService(geo);

locationRouter.post("/update", async (req, res) => {
  const { driver_id, lat, lng, bearing, speed } = req.body;
  await spatial.updateDriverLocation(driver_id, lat, lng, bearing, speed);
  res.json({ ok: true });
});

locationRouter.get("/nearby", async (req, res) => {
  const { lat, lng, radius_km = "5" } = req.query as Record<string, string>;
  const drivers = await spatial.getNearbyDrivers(parseFloat(lat), parseFloat(lng), parseFloat(radius_km));
  res.json({ drivers });
});

locationRouter.get("/driver/:id", async (req, res) => {
  const location = await spatial.getDriverLocation(req.params.id);
  if (!location) return res.status(404).json({ error: "Driver not found" });
  res.json(location);
});
