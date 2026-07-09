# Birth Chart Generator

Production Next.js app for birth chart generation.

## Structure

- `app/`: root Next.js App Router app
- `components/`, `hooks/`, `lib/`, `services/`: app code boundaries
- `workers/`: long-running daemons
- `scripts/`: one-shot operational scripts
- `packages/database/`: database package boundary
- `tests/`: root app and package tests
- `infrastructure/`: local Docker, production Docker, and nginx contracts
- `secrets/`: secret handling guidance
- `docs/`: internal engineering docs

There are no landing or documentation apps, and no staging runtime.

## Commands

```bash
pnpm dev
pnpm docker:dev
pnpm lint
pnpm type-check
pnpm test:unit
pnpm build
```

## Production

Local and production runtime contracts live in [infrastructure/](infrastructure/). The app exposes `/api/health` for deployment checks.
