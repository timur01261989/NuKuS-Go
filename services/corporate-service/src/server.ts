import express from "express";
import cors from "cors";
import { corporateRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/corporate", corporateRouter);
app.get("/health", (_, res) => res.json({ service: "corporate", status: "ok" }));

const PORT = Number(process.env.PORT) || 3018;
app.listen(PORT, () => console.warn(`[corporate-service] :${PORT}`));
