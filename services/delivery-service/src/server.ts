import express from "express";
import cors from "cors";
import { deliveryRouter } from "./delivery.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/delivery", deliveryRouter);
app.get("/health", (_, res) => res.json({ service: "delivery", status: "ok" }));

const PORT = Number(process.env.PORT) || 3003;
app.listen(PORT, () => console.warn(`[delivery-service] :${PORT}`));
