# packages/database/AGENTS.md

Rules for the database workspace package.

## Purpose

- Keep schema, migrations, database clients, and database-specific types out of the root app.
- Export a small, stable API from `src/index.ts`.

## Boundaries

- Do not import from `app/`, `components/`, or React code.
- Keep database clients lazily initialized. `next build` must not require live runtime secrets.
- Add package tests under [tests/unit/packages/database/](../../tests/unit/packages/database/).
- This package tracks production and local/test contracts only. Do not add staging-specific scripts or environment names.
