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
pnpm dev:procs
pnpm dev
pnpm docker:dev
pnpm db:generate
pnpm db:migrate
pnpm secrets:decrypt
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:unit
pnpm build
```

## Production

Local and production runtime contracts live in [infrastructure/](infrastructure/). The app exposes `/api/health` for deployment checks.

Encrypted local and production environment files live in [secrets/](secrets/). See [SOPS secret management](docs/setup/secrets/sops-secret-management.md) for age key generation and daily commands.

## GitHub workflow

Feature branches open pull requests into `main`, which is the production branch. Commit and PR title rules, required checks, labels, and deployment automation are documented in [GitHub governance](docs/deployment/github-governance.md).
