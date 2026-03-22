import express from "express";
import cors from "cors";
import { sduiRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/sdui", sduiRouter);
app.get("/health", (_, res) => res.json({ service: "sdui", status: "ok" }));
const PORT = Number(process.env.PORT) || 3029;
app.listen(PORT, () => console.warn(`[sdui-service] :${PORT}`));
