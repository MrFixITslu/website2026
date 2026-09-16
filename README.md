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
