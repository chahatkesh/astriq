# Production Runtime

This repo tracks one deployed runtime: production.

## Contracts

- App process: `pnpm start` after `pnpm build`
- Docker image: [../../infrastructure/dockerfiles/Dockerfile.prod](../../infrastructure/dockerfiles/Dockerfile.prod)
- Compose stack: [../../infrastructure/docker/docker-compose.prod.yml](../../infrastructure/docker/docker-compose.prod.yml)
- GitHub deployment template: [../../.github/workflows/root-deploy-production.yml](../../.github/workflows/root-deploy-production.yml)
- Health endpoint: `/api/health`
- Environment contract: [../../.env.example](../../.env.example)

## No staging

Do not add `staging` env values, compose files, workflows, or scripts. Use local development and production as the only supported runtime classes unless this policy changes in a decision record.
