# Local Development

This repo uses a small local process setup with one app, one local database, and no staging runtime.

## Process Manager

```bash
pnpm dev:procs
```

`mprocs.yaml` starts:

- `database`: local PostgreSQL through Docker Compose.
- `main-app`: the Next.js app at the repo root.
- `database-studio`: Prisma Studio, manual start only.

There are no landing or documentation app processes.

## Database

```bash
pnpm docker:dev
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:seed
```

Production database migrations use:

```bash
pnpm db:deploy
```

`DATABASE_URL` is documented in [.env.example](../../.env.example). Local Docker defaults to:

```text
postgresql://postgres:postgres@localhost:5432/birth_chart_generator_dev
```

Auth and generation quota defaults are also defined in
[.env.example](../../.env.example):

- `AUTH_SESSION_SECRET`
- `MAX_CHARTS_PER_USER`
- `KUNDLI_ENGINE_BACKEND=jpl_spice`
- `KUNDLI_ENGINE_BIN`
- `KUNDLI_SPICE_KERNEL_DIR`

## Kundli engine (C++ / SPICE)

Production chart calculation uses the native CLI under
`services/astrology-engine`, linked against NAIF CSPICE and JPL DE442s kernels.

```bash
pnpm engine:deps    # downloads CSPICE + kernels into gitignored paths
pnpm build:engine
pnpm test:engine
```

The Prisma schema, migrations, seed, and client boundary live in [packages/database/](../../packages/database/). App and service code should import `db` from [lib/db.ts](../../lib/db.ts).
