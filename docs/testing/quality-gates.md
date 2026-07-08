# Quality Gates

Run these before shipping structural or runtime changes:

```bash
pnpm format:check
pnpm lint
pnpm db:check-migration
pnpm type-check
pnpm test:unit
pnpm build
```

Husky runs migration checks, lint-staged, type-checking, and unit tests before commits.
