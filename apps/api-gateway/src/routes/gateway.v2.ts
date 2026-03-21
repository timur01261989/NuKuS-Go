import { Router } from "express";
// v2 routes - future expansion
const router = Router();
router.get("/health", (_, res) => res.json({ version: "v2", status: "ok" }));
export default router;
