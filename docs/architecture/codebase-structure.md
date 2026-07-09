# Codebase Structure

This repo follows a production-focused structure with one main app and one production deployment target.

## Top-level folders

- `app/`: Next.js App Router routes and route handlers.
- `components/`: Reusable React components and UI primitives.
- `hooks/`: Client-side React hooks.
- `lib/`: Shared utilities, env contracts, logging, worker helpers, and API helpers.
- `services/`: Business workflows and external integrations.
- `workers/`: Long-running daemon entrypoints.
- `scripts/`: One-shot local, CI, and production helper scripts.
- `packages/database/`: Database schema/client boundary.
- `tests/`: Root app and package tests.
- `infrastructure/`: Production Docker and reverse proxy contracts.
- `secrets/`: Secret handling guidance only. Plaintext secrets are never committed.
- `docs/`: Internal engineering guidance.

## Environment policy

Supported runtime environments are `development`, `test`, and `production`. Staging is intentionally not modeled in this codebase.
