import "dotenv/config";
import { Documentation } from "express-zod-api";
import { routing } from "./routing.js";
import { mkdirSync, writeFileSync } from "fs";

const config = {
  cors: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  }),
  logger: { level: "warn" as const, color: false },
};

const documentation = new Documentation({
  routing,
  config,
  version: "1.0.0",
  title: "API",
  serverUrl: "http://localhost:3000",
  composition: "inline",
});

mkdirSync("docs", { recursive: true });
writeFileSync("docs/openapi.json", documentation.getSpecAsJson());
writeFileSync("docs/openapi.yaml", documentation.getSpecAsYaml());
console.log("OpenAPI spec generated → docs/openapi.json");
