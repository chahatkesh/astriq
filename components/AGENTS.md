# components/AGENTS.md

Rules for reusable React components. Read after the root [AGENTS.md](../AGENTS.md).

## Layout

- `components/ui/` is reserved for low-level UI primitives.
- Feature folders under `components/` should match the domain they serve.
- Export stable cross-feature components through [index.ts](index.ts).

## Patterns

- Prefer server components unless interactivity requires `"use client"`.
- Keep data loading in routes, server actions, hooks, or services. Components should receive data and callbacks through props.
- One significant component per file. Use PascalCase filenames for component files.
- Keep reusable text, formatting, and validation outside components when they are shared by routes or services.
