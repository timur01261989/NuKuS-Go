import { Router } from "express";
import { getRoute, getMatrix } from "./osrm.client";
import { updateTrafficSegment, getNearbyTrafficSegments } from "./traffic.service";
import { startNavigation, updatePosition, endNavigation } from "./navigation.service";

export const routingRouter = Router();

// Get route between points
routingRouter.post("/route", async (req, res) => {
  try {
    const { waypoints, profile = "car", alternatives = true } = req.body;
    if (!waypoints?.length || waypoints.length < 2)
      return res.status(400).json({ error: "Kamida 2 ta nuqta kerak" });
    const route = await getRoute(waypoints, profile, alternatives);
    res.json(route);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Distance/time matrix (for batch matching)
routingRouter.post("/matrix", async (req, res) => {
  try {
    const { origins, destinations, profile = "car" } = req.body;
    res.json(await getMatrix(origins, destinations, profile));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Traffic data ingestion
routingRouter.post("/traffic", async (req, res) => {
  try {
    await updateTrafficSegment(req.body);
    res.json({ ok: true });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Nearby traffic
routingRouter.get("/traffic/nearby", async (req, res) => {
  try {
    const { lat, lng, radius_km = "5" } = req.query as Record<string, string>;
    res.json(await getNearbyTrafficSegments(+lat, +lng, +radius_km));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Navigation session management
routingRouter.post("/navigation/start", async (req, res) => {
  try {
    const { driver_id, order_id, from, to, via } = req.body;
    res.json(await startNavigation(driver_id, order_id, from, to, via));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

routingRouter.post("/navigation/:sessionId/update", async (req, res) => {
  try {
    const { driver_id, lat, lng } = req.body;
    res.json(await updatePosition(req.params.sessionId, driver_id, lat, lng));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

routingRouter.post("/navigation/:sessionId/end", async (req, res) => {
  try {
    await endNavigation(req.params.sessionId);
    res.json({ ok: true });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});
