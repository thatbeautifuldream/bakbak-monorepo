# Monorepo Template

A production-ready TypeScript monorepo with authentication, type-safe API, and a modern frontend. Drop in your domain and ship.

## Stack

| Layer | Tool |
|---|---|
| Monorepo | Turborepo + Bun workspaces |
| API | Express 5 + express-zod-api v27 |
| Auth | Better Auth (email/password + OAuth) |
| Database | PostgreSQL + Drizzle ORM (Neon serverless) |
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 |
| Type Safety | Hey API (OpenAPI → TypeScript + React Query) |
| Queries | TanStack React Query |

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/website/.env.example apps/website/.env
# Fill in the values in both .env files

# 3. Generate and run database migrations
bun run db:generate
bun run db:migrate

# 4. Start development servers
bun run dev
```

- API: http://localhost:3000
- API Docs: http://localhost:3000/docs
- Website: http://localhost:3001

## Architecture

```
packages/typescript-config/   Shared TypeScript base configs
packages/eslint-config/       Shared ESLint flat configs

apps/api/                     Express REST API + Better Auth + Drizzle
  src/
    index.ts                  Entry point, Express server
    auth.ts                   Better Auth config + middleware factories
    routing.ts                express-zod-api route tree
    generate-openapi.ts       Build-time OpenAPI spec generation
    db/schema.ts              Drizzle table definitions
    endpoints/                REST endpoint handlers
    lib/                      Shared API utilities

apps/website/                 Next.js 16 frontend
  app/                        App Router pages
    login/                    Sign in
    signup/                   Sign up
    dashboard/                Protected page (auth guard)
  client/                     AUTO-GENERATED — do not edit
    sdk.gen.ts                Typed fetch functions (from OpenAPI)
    types.gen.ts              TypeScript types (from OpenAPI)
    @tanstack/                React Query hooks + query keys
  lib/
    auth-client.ts            Better Auth client (signIn, signUp, useSession)
    api/client-config.ts      Hey API client setup (base URL, error interceptor)
    api/error.ts              ApiError class
    react-query/              Query & mutation option factories (QO, MO)
  components/
    query-provider.tsx        React Query + API client initialization
    theme-provider.tsx        Dark/light theme (next-themes)
```

## Build Pipeline

```
packages/typescript-config  →  apps/api extends base.json
apps/api build              →  generates docs/openapi.json
                                ↳
apps/website build          →  openapi-ts reads openapi.json
                                → generates client/ (SDK + types + React Query hooks)
                                → next build
```

Turbo enforces topological order: shared packages build first, then API, then website.

## How to Add a New Endpoint

### 1. Create the endpoint — group by resource (`apps/api/src/endpoints/<resource>.ts`)

```typescript
// apps/api/src/endpoints/items.ts
import { z } from "zod";
import { authenticatedEndpointsFactory } from "../auth.js";

export const listItemsEndpoint = authenticatedEndpointsFactory.build({
  method: "get",
  input: z.object({}),
  output: z.object({ items: z.array(z.object({ id: z.string(), name: z.string() })) }),
  handler: async ({ ctx }) => {
    return { items: [] };
  },
});
```

### 2. Register in the route tree (`apps/api/src/routing.ts`)

```typescript
import { listItemsEndpoint } from "./endpoints/items.js";

export const routing = {
  v1: {
    me: { ... },
    items: {
      get: listItemsEndpoint,
    },
  },
};
```

### 3. Rebuild the API to regenerate the OpenAPI spec

```bash
bun --filter api build
```

### 4. Generate the client types

```bash
bun --filter website generate-client
```

### 5. Use in the frontend

```typescript
// Query option
import { getV1ItemsOptions } from "@/client/@tanstack/react-query.gen";
import type { GetV1ItemsResponse } from "@/client/types.gen";

const query = useQuery({
  ...getV1ItemsOptions(),
  select: (r: GetV1ItemsResponse) => r.data,
});
```

## How to Add a DB Table

### 1. Define the table in `apps/api/src/db/schema.ts`

```typescript
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 2. Generate and apply the migration

```bash
bun run db:generate
bun run db:migrate
```

## Environment Variables

### API (`apps/api/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `BETTER_AUTH_SECRET` | Yes | Secret key for auth |
| `BETTER_AUTH_URL` | Yes | API base URL (default: `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | Yes | Comma-separated allowed origins |
| `WEB_APP_URL` | Yes | Frontend URL for callbacks |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

### Website (`apps/website/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | API URL (default: `http://localhost:3000`) |

## Key Patterns

### Cross-Origin Auth

The website rewrites `/api/auth/*` and `/api/proxy/*` to the API via Next.js config. This is required for iOS Safari compatibility — direct cross-origin fetch silently drops cookies.

### Type Safety Pipeline

API endpoints are defined with `express-zod-api` using Zod schemas for input/output. The OpenAPI spec is generated at build time. The website uses `@hey-api/openapi-ts` to generate a fully typed SDK + React Query hooks from that spec. No manual type definitions needed.

### Auth Middleware

`authenticatedEndpointsFactory` validates the session and injects `ctx.authUser` / `ctx.authSession`. All protected endpoints use this factory. Extend with additional middleware for roles/permissions.
