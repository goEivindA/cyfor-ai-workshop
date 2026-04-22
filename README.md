# Cyfor Workshop

Monorepo with an **API** (Hono + Prisma + SQLite) and a **Web** frontend (React + Vite).

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

```bash
npm install
npm run dev
```

This starts both projects concurrently — the API on `http://localhost:3000` and the Vite dev server on `http://localhost:5173`. The web server waits for the API health check before starting.

### Run projects individually

```bash
# API only (default port 3000, override with API_PORT)
npm run dev:api

# Web only (assumes API is already running)
npm run dev:web
```

### Other commands

| Command | Description |
| --- | --- |
| `npm run build` | Build all workspaces |
| `npm run generate` | Run code generation (Prisma client + OpenAPI + Orval) |
| `npm run typecheck` | Type-check all workspaces |

## Inspecting the SQLite Database

The API uses a SQLite database at `api/data/workshop.db`. It is created automatically on first run via `prisma db push`.

### Option 1: Prisma Studio

```bash
npx prisma studio --schema api/prisma/schema.prisma
```

This opens a browser UI at `http://localhost:5555` where you can browse and edit data directly.

> **Corporate proxy / TLS error?** If you get a `SELF_SIGNED_CERT_IN_CHAIN` error, run this first:
> ```bash
> # Git Bash / macOS / Linux
> export NODE_TLS_REJECT_UNAUTHORIZED=0
>
> # Windows CMD
> set NODE_TLS_REJECT_UNAUTHORIZED=0
> ```
> **Warning:** This disables TLS certificate verification and should never be used in production.

### Option 2: VS Code extension

Install the **SQLite Viewer** extension, then open `api/data/workshop.db` directly in VS Code.

### Reset the database

```bash
# macOS / Linux
rm api/data/workshop.db

# Windows PowerShell
Remove-Item api/data/workshop.db

# Windows CMD
del api\data\workshop.db

npm run dev
```

The database and schema are recreated on startup.

## Project Structure

```text
├── api/          # Hono REST API + Prisma + SQLite
├── web/          # React + Vite + TailwindCSS frontend
└── package.json  # npm workspaces root
```

See [api/README.md](api/README.md) and [web/README.md](web/README.md) for project-specific details.
