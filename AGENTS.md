# AGENTS.md — Monorepo Template

> **Self-improving. `wc -c AGENTS.md` to never exceed 40,000 chars.** Only document what code cannot reveal.

---

## Commands

```bash
bun run dev                # All apps in dev mode
bun run build              # Build all workspaces (rebuilds OpenAPI spec + SDK)
bun --filter api test      # Run API tests
bun --filter api test:watch
bun run db:generate        # Generate migration from schema changes
bun run db:migrate         # Apply pending migrations
bun run db:studio          # Drizzle Studio (DB browser)
bun --filter api build     # Build API only (regenerates openapi.json)
bun --filter @repo/api-client generate-client  # Regenerate typed SDK after API change
```

After changing endpoints: `bun --filter api build && bun --filter @repo/api-client generate-client`.

---

## Architecture

Monorepo: **`apps/api/`** (Express REST API), **`apps/website/`** (Next.js 16 frontend), **`packages/api-client/`** (auto-generated type-safe SDK from OpenAPI spec via `@hey-api/openapi-ts`).

```
apps/api/src/
  index.ts                  → dotenv/config → server boot
  auth.ts                   → Better Auth + session/admin middleware factories
  routing.ts                → express-zod-api route tree
  domain/                   → pure domain logic — keep express + db out of the function signatures where you can
  endpoints/                → REST adapters, grouped by resource (e.g. user.ts, items.ts)
  db/schema.ts              → Drizzle table definitions + enums
  lib/                      → shared utilities (constants, email, etc.)
```

---

## Patterns

### express-zod-api

- `z` is from `zod`
- Handlers **return** output objects — never call `res.json()`/`res.status()`
- Path params (`:itemId`) must be declared in the endpoint's `input` schema
- Nested path params with their own endpoint + children: use the `_self` key in routing
- Group endpoints by resource in a single file (`endpoints/user.ts` exports `getMeEndpoint` + `updateProfileEndpoint`). Mirror the same name in `tests/endpoints/` (e.g. `tests/endpoints/user.spec.ts`).
- For an endpoint whose response shape differs by status code (e.g. `201 created` vs `409 duplicate-with-existing-id`), build a custom factory with `ResultHandler` rather than smearing optional fields across one schema. Upstream `express-zod-api` calls this `statusDependingFactory`.
- For paginated lists, use `ez.paginated()` from `express-zod-api` — gives you `limit`/`offset` input and `{ items, total, limit, offset }` output for free.

### Identity & Security

- Browser → API fetch must go through `/api/proxy/...` (Next.js rewrite). Direct cross-origin fetch drops cookies on iOS Safari.
- `middleware.ts` handles auth guards and redirects.
- `role: "user" | "admin"` on users table — `adminEndpointsFactory` chains auth + role check. For more roles, extend the enum and build a new factory rather than role-checking inside handlers.

### Database & Migrations

- New columns on existing tables: migration needs `DEFAULT` then `DROP DEFAULT` to backfill.
- Multi-filter queries: always `and(...conditions)`, never `conditions[0]` alone.
- The `drizzle/` migrations folder starts empty — run `bun run db:generate` once your schema is defined to create the baseline migration.
- Every table defined in `db/schema.ts` exports companion zod schemas via `drizzle-zod`: `xxxSelectSchema` / `xxxInsertSchema` / `xxxUpdateSchema`. Use `.pick()` / `.omit()` / `.extend()` from these in endpoint `input`/`output` rather than redeclaring field types — keeps wire schemas in sync with the table. See `endpoints/user.ts` for the pattern.

### Domain Layer

- `src/domain/` is the canonical location for business logic. Endpoints are thin adapters: parse input, call domain function, shape output.
- Prefer pure functions in the domain layer; pass in dependencies (db handle, clock) at the call site so the domain is trivially testable.

### Tests

- Vitest. Tests live in `apps/api/tests/`.
- Endpoint tests mock the db and auth modules (`tests/helpers/db.ts`, `tests/helpers/auth.ts`) and use `testEndpoint` from `express-zod-api`. See `tests/endpoints/user.spec.ts` for the in-repo example.
- Domain tests should hit the pure functions directly — no mocks.

### Frontend Types

- Client SDK in `packages/api-client/` — auto-generated from OpenAPI spec.
- Type regeneration: modify endpoints → `bun --filter api build` → `bun --filter @repo/api-client generate-client`.
- Website domain types in `lib/domain/` derive from `@repo/api-client/types` — never manually define API types.

## Code Style

- No comments unless explicitly requested.
- ESM throughout (`.js` extensions in imports, `"type": "module"`).
- Named exports only.
