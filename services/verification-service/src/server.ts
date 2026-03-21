import express from "express";
import cors from "cors";
import { verificationRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/verification", verificationRouter);
app.get("/health", (_, res) => res.json({ service: "verification", status: "ok" }));
const PORT = Number(process.env.PORT) || 3021;
app.listen(PORT, () => console.warn(`[verification-service] :${PORT}`));
