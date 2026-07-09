# Quality Gates

Run these before shipping structural or runtime changes:

```bash
pnpm lint
pnpm type-check
pnpm test:unit
pnpm build
```

Husky runs lint-staged, type-checking, and unit tests before commits.
