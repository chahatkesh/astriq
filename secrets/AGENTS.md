# secrets/AGENTS.md

Rules for deployment secrets.

- Never commit plaintext `.env`, `.env.production`, API keys, tokens, or private birth data.
- Production is the only deployed environment tracked here. Do not add staging secret files.
- Keep the non-secret contract in [.env.example](../.env.example).
- If encrypted secrets are introduced, use SOPS or the deployment platform secret store and document the exact workflow here before committing encrypted files.
