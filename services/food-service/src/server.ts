import express from "express";
import cors from "cors";
import { foodRouter } from "./food.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/food", foodRouter);
app.get("/health", (_, res) => res.json({ service: "food", status: "ok" }));

const PORT = Number(process.env.PORT) || 3011;
app.listen(PORT, () => console.warn(`[food-service] :${PORT}`));
