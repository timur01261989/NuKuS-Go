import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { typeDefs }      from "./schema/typeDefs";
import { createResolvers } from "./schema/resolvers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function bootstrap() {
  const app        = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: createResolvers(),
  });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const serverCleanup = useServer({
    schema,
    context: async (ctx: any) => {
      const token = ctx.connectionParams?.authorization?.replace("Bearer ", "");
      if (!token) return {};
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return { userId: payload.sub, role: payload.role };
      } catch { return {}; }
    },
  }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() { await serverCleanup.dispose(); },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== "production",
  });

  await server.start();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.use("/graphql", expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return {};
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return { userId: payload.sub, role: payload.role };
      } catch { return {}; }
    },
  }));

  app.get("/health", (_, res) => res.json({ service: "graphql-gateway", status: "ok" }));

  const PORT = Number(process.env.PORT) || 4000;
  httpServer.listen(PORT, () => console.warn(`[graphql-gateway] :${PORT}/graphql`));
}

bootstrap().catch(console.error);
