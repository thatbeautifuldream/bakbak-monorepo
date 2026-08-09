import "dotenv/config";
import { createServer, Documentation } from "express-zod-api";
import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { routing } from "./routing.js";
import { auth } from "./auth.js";
import { mkdirSync, writeFileSync } from "fs";

const appName = process.env.APP_NAME ?? "MyApp";

const trustedOrigins = (
  process.env.TRUSTED_ORIGINS ?? "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = {
  cors: ({ request }: { request: any }) => {
    const origin = request.headers.origin;
    return {
      "Access-Control-Allow-Origin":
        origin && trustedOrigins.includes(origin) ? origin : trustedOrigins[0],
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    };
  },
  logger: {
    level: "debug" as const,
    color: true,
  },
  http: {
    listen: 3000,
  },
  beforeRouting: ({ app, getLogger }: { app: any; getLogger: any }) => {
    app.use(
      cors({
        origin: trustedOrigins,
        credentials: true,
      }),
    );
    app.all("/api/auth/*splat", toNodeHandler(auth));

    const documentation = new Documentation({
      routing,
      config,
      version: "1.0.0",
      title: `${appName} API`,
      serverUrl: "http://localhost:3000",
      composition: "inline",
      tags: {
        users: { description: "User account management" },
      },
    });

    const logger = getLogger();
    logger.info(`Serving API docs at http://localhost:3000/docs`);

    mkdirSync("docs", { recursive: true });
    writeFileSync("docs/openapi.yaml", documentation.getSpecAsYaml());
    writeFileSync("docs/openapi.json", documentation.getSpecAsJson());

    app.use(
      "/docs",
      apiReference({
        content: documentation.getSpecAsJson(),
      }),
    );
  },
};

const { logger } = await createServer(config, routing);

logger.info(`${appName} API running on http://localhost:3000`);
