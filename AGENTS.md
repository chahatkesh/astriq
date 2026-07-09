<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Birth Chart Generator Rules

This repo follows a production-focused structure with one main app and one production runtime.

## Shape

- `app/` is the only Next.js app. Do not add separate landing or documentation apps.
- Production is the only deployed server target. Do not add staging scripts, compose files, secrets, or docs.
- Shared UI belongs in `components/`, hooks in `hooks/`, reusable helpers in `lib/`, business logic in `services/`, long-running daemons in `workers/`, and one-shot utilities in `scripts/`.
- Database-specific schema/client code belongs in `packages/database/`.
- Root app tests live in `tests/unit/app/`; package tests live in `tests/unit/packages/`.
- Claude Code repo rules live in `.claude/`; keep them aligned with these instructions when workflow policy changes.

## Runtime

- Supported app environments are `development`, `test`, and `production`.
- Keep runtime secrets out of git. Document non-secret contracts in `.env.example`.
- Use `/api/health` for production health checks.
