import express from "express";
import cors from "cors";
import { RideEngine } from "./engine";

const app = express();
const engine = new RideEngine();
app.use(cors());
app.use(express.json());

app.post("/ride/order",  async (req, res) => { try { res.json(await engine.createOrder(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
app.patch("/ride/:id",   async (req, res) => { try { res.json(await engine.updateStatus(req.params.id, req.body.status, req.body.driver_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
app.get("/ride/:id",     async (req, res) => { try { res.json(await engine.getOrder(req.params.id)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
app.get("/health",       (_, res) => res.json({ service: "ride", status: "ok" }));

const PORT = Number(process.env.PORT) || 3002;
app.listen(PORT, () => console.warn(`[ride-service] :${PORT}`));
