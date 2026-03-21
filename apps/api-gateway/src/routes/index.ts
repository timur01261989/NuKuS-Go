import { Router } from "express";
import v1 from "./gateway.v1";
import v2 from "./gateway.v2";
import { checkAllServices } from "../utils/healthCheck";

const router = Router();
router.use("/v1", v1);
router.use("/v2", v2);

router.get("/health", (_, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

router.get("/health/services", async (_, res) => {
  const results = await checkAllServices();
  const allHealthy = results.every(r => r.status === "healthy");
  res.status(allHealthy ? 200 : 207).json({ ok: allHealthy, services: results });
});

export default router;
