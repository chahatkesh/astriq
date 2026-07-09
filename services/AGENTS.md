# services/AGENTS.md

Rules for business logic. Read after the root [AGENTS.md](../AGENTS.md).

## What belongs here

- Durable workflows, database reads/writes, transactions, external API calls, and domain orchestration.
- Route handlers should stay thin and call named service functions.

## Boundaries

- No React, JSX, or `"use client"` files.
- Do not initialize databases or SDKs at module scope. Use lazy getters.
- Log through [lib/logger.ts](../lib/logger.ts) and avoid logging secrets, raw tokens, or sensitive birth data.
- Keep one service entrypoint per file, named `<domain>-service.ts`.
