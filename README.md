# Astriq

Astriq is a production Next.js app for Vedic birth chart (kundli) generation. Guests can draft birth details; signed-in users generate charts, keep history, and stay within a per-user quota.

## Features

- Locale-aware guest landing with draft birth details preserved through sign-in
- Email/password accounts with signed HTTP-only session cookies
- Authenticated kundli workspace with saved chart history
- Configurable per-user generation quota (`MAX_CHARTS_PER_USER`)
- C++ kundli engine with JPL SPICE ephemeris support (`KUNDLI_ENGINE_BACKEND=jpl_spice`)
- Multilingual UI strings and astrology glossary coverage

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- PostgreSQL via Prisma (`packages/database`)
- Native kundli calculation engine under `services/astrology-engine`
- Docker Compose for local database and production app runtime
- SOPS + age for encrypted environment files

## Quick start

Prerequisites: Node.js 20.9+, pnpm 10, Docker, and (for secrets) SOPS + age.

```bash
pnpm install
pnpm secrets:decrypt          # writes .env from secrets/local.enc.yaml
pnpm docker:dev               # local PostgreSQL
pnpm db:generate
pnpm db:migrate
pnpm ephemeris:download       # JPL SPICE kernels when using jpl_spice
pnpm build:engine
pnpm dev                      # or: pnpm dev:procs
```

Runtime contract (non-secret keys and placeholders): [.env.example](.env.example).

## Commands

```bash
pnpm dev:procs
pnpm dev
pnpm build:engine
pnpm test:engine
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

## Repository layout

| Path                                         | Role                                             |
| -------------------------------------------- | ------------------------------------------------ |
| `app/`                                       | Next.js App Router surface                       |
| `components/`, `hooks/`, `lib/`, `services/` | UI, hooks, shared helpers, business logic        |
| `workers/`                                   | Long-running daemons                             |
| `scripts/`                                   | One-shot operational scripts                     |
| `packages/database/`                         | Prisma schema, migrations, and client boundary   |
| `tests/`                                     | Root app and package unit tests                  |
| `infrastructure/`                            | Local Docker, production Docker, nginx templates |
| `secrets/`                                   | SOPS-encrypted environment files                 |
| `docs/`                                      | Internal engineering docs                        |

There are no separate landing or documentation apps, and no staging runtime.

## Production

Local and production runtime contracts live in [infrastructure/](infrastructure/). The app exposes `/api/health` for deployment checks.

The kundli calculation pipeline and C++ engine contract are documented in [Kundli calculation pipeline](docs/architecture/kundli-calculation-pipeline.md).

Key runtime env values (see [.env.example](.env.example)):

- `AUTH_SESSION_SECRET`
- `MAX_CHARTS_PER_USER`
- `KUNDLI_ENGINE_BACKEND=jpl_spice`
- `NEXT_PUBLIC_APP_NAME=Astriq`

Encrypted local and production environment files live in [secrets/](secrets/). See [SOPS secret management](docs/setup/secrets/sops-secret-management.md).

## GitHub workflow

Feature branches open pull requests into `main`, which is the production branch. Commit and PR title rules, required checks, labels, and deployment automation are documented in [GitHub governance](docs/deployment/github-governance.md).

## Docs

- [Local development](docs/setup/local-development.md)
- [Production runtime](docs/deployment/production-runtime.md)
- [Root CI/CD](docs/deployment/root-ci-cd.md)
- [Quality gates](docs/testing/quality-gates.md)
- [Codebase structure](docs/architecture/codebase-structure.md)
