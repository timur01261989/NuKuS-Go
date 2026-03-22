import express from "express";
import cors from "cors";
import { ratingRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/rating", ratingRouter);
app.get("/health", (_, res) => res.json({ service: "rating", status: "ok" }));
const PORT = Number(process.env.PORT) || 3033;
app.listen(PORT, () => console.warn(`[rating-service] :${PORT}`));
