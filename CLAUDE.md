# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a workshop monorepo (npm workspaces) for learning AI-assisted development. The app is a **booking/resource management system** with:

- `api/` — Hono REST API with Prisma ORM and SQLite
- `web/` — React + Vite + TailwindCSS v4 frontend

## Commands

All commands run from the repo root unless noted.

```bash
npm run dev           # Start both API (port 3000) and web (port 5173) concurrently
npm run dev:api       # API only
npm run dev:web       # Web only (assumes API is already running)
npm run generate      # Regenerate Prisma client + export OpenAPI + regenerate Orval hooks
npm run build         # Build all workspaces
npm run typecheck     # Type-check all workspaces
```

Reset the database:
```bash
rm api/data/workshop.db && npm run dev
```

Inspect the database (browser UI at port 5555):
```bash
npx prisma studio --schema api/prisma/schema.prisma
```

## Code generation pipeline

The API contract flows through three steps; **run `npm run generate` after any schema or route change**:

1. `prisma generate` — generates Prisma client from `api/prisma/schema.prisma`
2. `api/scripts/export-openapi.ts` — exports the live OpenAPI spec to `api/openapi.json`
3. Orval reads `api/openapi.json` and writes TanStack Query hooks to `web/src/api/generated/hooks.ts`

## Architecture

### API (`api/src/app.ts`)

All routes are defined schema-first using `@hono/zod-openapi`. Each route is a `createRoute(...)` call with Zod request/response schemas, then registered via `app.openapi(route, handler)`. The OpenAPI spec is served live at `/openapi.json`. This schema-first pattern means route types and OpenAPI docs are always in sync.

### Web (`web/src/`)

The frontend consumes only the generated hooks from `web/src/api/generated/hooks.ts` — never hand-writes fetch calls. The custom Axios client in `web/src/api/client.ts` uses `/api` as the base URL; Vite proxies that to `http://localhost:3000` in development (stripping the `/api` prefix). The proxy target can be overridden via the `VITE_API_PROXY_TARGET` env var.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `API_PORT` | root | Override API port (default 3000) |
| `CORS_ORIGIN` | `api/` | Comma-separated allowed CORS origins for deployed frontends |
| `VITE_API_PROXY_TARGET` | `web/` | Override API proxy target (default `http://localhost:3000`) |
