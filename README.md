# Vision79 Digital website

Marketing site, contact capture, CRM, course authoring and learner portal.

Use Node 24 and npm. Read [PRODUCTION.md](PRODUCTION.md) before upgrading an existing deployment: it covers backups, encrypted storage migration, the one-time administrator credential reset, HTTPS cookies, proxy configuration and release checks.

```bash
npm ci
cp .env.example .env
# Configure your local origin and integrations in .env.
# For local development, CANONICAL_DOMAIN=http://localhost:3000.
npm run dev
```

The first administrator setup credential is stored locally in `data/.admin_setup_password` unless a unique ADMIN_PASSWORD is configured. It must be changed after login. Never commit runtime data, credentials or uploads.

```bash
npm run lint
npm run build
npm test
npm start
```

Production Docker runs as a non-root user on the private proxy network. Use `docker compose build && docker compose up -d` only after completing the deployment checklist.

Learners have authenticated enrollment, saved progress/notes, server-graded assessments and verifiable certificates. Paid enrollment requires staff approval; no online payment processor is connected. The CRM prospect finder searches an operator-imported directory; Ollama provides explicitly heuristic analysis, not live social-network verification.

## Automatic server deployment

After a validated merge to `main`, the delivery workflow deploys the `V79website` service through Tailscale and pinned SSH. Publication to GHCR alone never changes the server. In GitHub **Settings → Environments → production**, configure the secrets `TAILSCALE_AUTHKEY`, `DEPLOY_HOST` (the server's Tailscale address), `DEPLOY_USER`, `DEPLOY_SSH_KEY` (private deploy key), and `DEPLOY_KNOWN_HOSTS` (independently verified host key). Restrict who can change the production environment. Configure environment variables `DEPLOY_ROOT` (absolute existing server directory containing this app's Compose file and `.env`), `DEPLOY_PROJECT` (the current Compose project shown by `docker inspect`), and optional `DEPLOY_SSH_PORT` (default 22).

The deploy user needs Docker and `rsync` access and the server must already have `proxy_network`. Before enabling the workflow, back up the application's existing data, encryption keys, uploads, databases and `.env` and verify a restore. The script preserves `.env`, `data`, `uploads`, backups and existing `.git`; it updates the app in place, starts only `V79website` and checks its HTTP readiness inside the container. It does not remove orphan containers or volumes. Source removed from Git may remain in the server directory because deployment intentionally does not delete unknown local files. A first merge will fail closed if a required secret, mount, project, or server directory is absent. Review Actions → deploy and record the `.deployed_sha` in the server directory after each successful release.
