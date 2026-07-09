# Claude Code Notes

Read [AGENTS.md](AGENTS.md) before editing. This repo has one Next.js app, one production runtime, and no staging environment.

Project-specific Claude Code configuration lives in [.claude/](.claude/):

- `.claude/settings.json` blocks large/generated/secret reads and wires safety hooks.
- `.claude/rules/` contains repo guardrails for branches, docs, env vars, feature contracts, database work, and chart accuracy.
- `.claude/skills/` contains repeatable workflows for commits, PRs, verification, database migrations, issue drafting, and calculation work.
- `.claude/agents/` contains read-only audit agents for deeper reviews.

Do not read plaintext secrets, generated clients, `.next/`, `node_modules/`, or `.env*` files. Use explicit user approval for commits, pushes, PRs, issue writes, and history rewrites.
