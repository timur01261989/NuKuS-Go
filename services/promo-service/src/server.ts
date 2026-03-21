import express from "express";
import cors from "cors";
import { promoRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/promo", promoRouter);
app.get("/health", (_, res) => res.json({ service: "promo", status: "ok" }));
const PORT = Number(process.env.PORT) || 3022;
app.listen(PORT, () => console.warn(`[promo-service] :${PORT}`));
