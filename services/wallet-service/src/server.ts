import express from "express";
import cors from "cors";
import { walletRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/wallet", walletRouter);
app.get("/health", (_, res) => res.json({ service: "wallet", status: "ok" }));
const PORT = Number(process.env.PORT) || 3024;
app.listen(PORT, () => console.warn(`[wallet-service] :${PORT}`));
