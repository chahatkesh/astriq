# Codebase Structure

This repo follows a production-focused structure with one main app and one production deployment target.

## Top-level folders

- `app/`: Next.js App Router routes and route handlers.
- `components/`: Reusable React components and UI primitives.
- `hooks/`: Client-side React hooks.
- `lib/`: Shared utilities, env contracts, logging, worker helpers, and API helpers.
- `services/`: Business workflows and external integrations.
- `workers/`: Long-running daemon entrypoints.
- `scripts/`: One-shot local, CI, and production helper scripts. Local process bootstrappers may live here when they only supervise external tools.
- `packages/database/`: Prisma schema, migrations, seed, and client boundary.
- `tests/`: Root app and package tests.
- `infrastructure/`: Local Docker, production Docker, and reverse proxy contracts.
- `secrets/`: Secret handling guidance only. Plaintext secrets are never committed.
- `docs/`: Internal engineering guidance.

## Environment policy

Supported runtime environments are `development`, `test`, and `production`. Local Docker is for development dependencies; staging is intentionally not modeled in this codebase.

## Local process policy

Use [mprocs.yaml](../../mprocs.yaml) for the local development process set. It should only manage the local PostgreSQL dependency, the root Next.js app, and manual support tools such as Prisma Studio.
