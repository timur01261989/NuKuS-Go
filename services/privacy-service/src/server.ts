import express from "express";
import cors from "cors";
import { privacyRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/privacy", privacyRouter);
app.get("/health", (_, res) => res.json({ service: "privacy", status: "ok" }));
const PORT = Number(process.env.PORT) || 3027;
app.listen(PORT, () => console.warn(`[privacy-service] :${PORT}`));
