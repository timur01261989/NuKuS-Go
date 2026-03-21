import express from "express";
import cors   from "cors";
import helmet from "helmet";
import { loggerMiddleware }       from "./middlewares/logger.middleware";
import { rateLimiterMiddleware }  from "./middlewares/rateLimiter.middleware";
import { tracingMiddleware }      from "./middlewares/tracing.middleware";
import { geoBlockMiddleware }     from "./middlewares/geoBlock.middleware";
import routes                     from "./routes";
import { wsProxyController }      from "./controllers/wsProxy.controller";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(loggerMiddleware);
app.use(tracingMiddleware);
app.use(geoBlockMiddleware);
app.use(rateLimiterMiddleware);

// HTTP routes
app.use("/api", routes);

// WebSocket proxy (upgrade requests handled by http-proxy-middleware)
app.use("/ws", wsProxyController);

export default app;
