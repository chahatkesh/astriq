# app/AGENTS.md

Rules for the main Next.js App Router surface. Read after the root [AGENTS.md](../AGENTS.md).

## Routing

- This repo has one primary app: the root `app/` directory.
- Do not add separate landing, documentation, or staging apps.
- Route handlers live under `app/api/` and should delegate business logic to [services/](../services/) or shared helpers in [lib/](../lib/).
- Keep pages and layouts server components by default. Add `"use client"` only for browser APIs, state, effects, or event handlers.

## Boundaries

- App files compose UI and call service functions. They should not own durable business workflows directly.
- Shared route-safe helpers belong in [lib/](../lib/).
- Long-running background processes belong in [workers/](../workers/), not route handlers.

## Runtime

- Production is the only deployed server target tracked in this repo.
- Runtime checks should use `/api/health`.
