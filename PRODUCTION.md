# Production deployment and recovery

This release fixes the production audit findings. It requires **Node 24**, one application container, a local persistent disk, and HTTPS through Nginx Proxy Manager. It has not been deployed to your server by the code changes alone. Do not run multiple replicas or put this SQLite database on a network filesystem.

## Before upgrading

1. Stop the existing website container during migration. Back up the entire `data` and `uploads` directories, your `.env`, the existing image/commit, and any root-level `vision79_*.json` files. Keep the encryption key securely with a separately protected backup. A key change is not an upgrade step.
2. If `data/vision79_saas.db` exists, this is the old optional SQLite backend. While stopped, run `node scripts/export-legacy-sqlite.mjs data/vision79_saas.db /path/to/new-empty-export`. Review the exported counts. Preserve the original database and its sidecars in your offline backup. Copy the reviewed exports into `data` and move the old database and sidecars to the protected backup directory before starting. Do not discard existing CRM JSON files. If JSON and SQLite both contain newer conflicting records, reconcile those records before proceeding.
3. Apply this release on a separate Git branch and review the diff. Keep your existing `.env` and secrets; `.env.example` documents configuration, not production values.
4. Preserve `ENCRYPTION_KEY` exactly, or preserve `data/.encryption_key` when the environment key was blank. Missing/invalid keys or corrupt source JSON stop startup rather than reset data.
5. Prepare ownership for the non-root container: `sudo chown -R 1000:1000 data uploads`. Create those directories first if absent. They must be writable by container user `node` (UID 1000). Do not make them world-writable.
6. In Nginx Proxy Manager, forward the HTTPS host to **V79website:3000** on **proxy_network**. The Compose file no longer publishes host port 3000. Set `TRUSTED_PROXIES` to the trusted proxy's actual container IP or a narrowly controlled proxy-only network; do not use a hop count or an unrestricted trust setting. The proxy must replace incoming forwarding headers. Recheck this setting if its IP changes.
7. Set `CANONICAL_DOMAIN=https://v79sl.com` to the exact public origin. Cookies require HTTPS in production. For a temporary local browser test use development mode; API test clients can supply cookies explicitly.
8. Set the reCAPTCHA v3 public and secret keys for that hostname. `RECAPTCHA_SITE_KEY` is served through `/api/config`, so changing it does not require recompiling JavaScript. The default `CAPTCHA_MODE=required` rejects unverified contact requests, including when keys are absent. If you deliberately choose `CAPTCHA_MODE=disabled`, the contact form works with rate limits but no CAPTCHA. Make this choice explicitly.
9. Preserve the Tiquet intake URL/shared secret. Configure the existing Ollama container as `http://ollama:11434` and model `qwen2.5:3b` if that is your installed model. AI destinations are operator-controlled; arbitrary request-supplied URLs are ignored.

## Deploy and check

```bash
# Run inside the checked-out repository after completing the backup/configuration steps.
docker compose build
docker compose up -d
docker compose logs --tail=100 V79website
docker compose exec V79website node -e "fetch('http://127.0.0.1:3000/api/ready').then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)})"
```

The image includes only client/server build outputs and production packages. It does not copy runtime `data`, uploads or `.env` into image layers. `/api/health` reports liveness; `/api/ready` verifies durable storage writes.

**Administrator setup changes:** old, unversioned credentials are retired once on upgrade to eliminate the historical shared password. Read the generated setup password locally with `sudo cat data/.admin_setup_password`, sign in at `/admin`, and set your permanent password. The setup file is removed after successful rotation. Do not paste that password into a ticket or chat. A fresh install can instead use a unique `ADMIN_PASSWORD` of at least 16 characters. Sessions use Secure, HttpOnly, SameSite cookies, expire after two hours, and are invalidated by a restart/password rotation. Existing open admin tabs must sign in again.

After startup, validate on your real HTTPS hostname:

- Homepage, contact form, admin login/password change, resources/articles, course deep links and mobile navigation.
- `/server.cjs`, `/server.cjs.map` and `/server/server.cjs` return 404 through your real proxy/CDN. Purge any old cached backend artifacts.
- A real, consented contact-form submission appears once in CRM. Check its Tiquet status; only accepted delivery is `sent`. `pending`, `failed`, and `disabled` remain visible in **Admin → CRM → Enrollment and delivery queue**. Retry after correcting configuration. Receiver-side deduplication must use `eventId`.
- Create a learner account and save its recovery code. Enroll in a free course; save progress/notes, reload, complete the assessment, and verify the certificate link. For a paid course, the learner requests enrollment; staff verify payment separately and approve it in the queue. This site does not process card payments.
- Test Ollama from CRM settings; the configured inference endpoint must be reachable on the Docker network. Import your own verified directory in the CRM queue before prospect searches. No fabricated businesses or purported live social-network search are provided.

## Storage migration and backups

The app imports existing JSON documents on first access into `data/website.db` using SQLite transactions. Document values, including CRM and learner records, are encrypted with AES-256-GCM. Each imported source file is retained as an encrypted `.migrated.enc` backup and the plaintext source is removed. Existing encrypted personal fields remain readable with the original key. Valid data is never silently replaced by empty arrays after parse/read errors. Legacy unauthenticated examination records remain visible to staff; they are not promoted into verified learner certificates.

Take consistent backups with the container stopped: copy **all of `data`** (including any database WAL/SHM files), **uploads**, and the separately protected configuration/key. Do not copy only `website.db` while it is running. Restore the complete directory/key set into a staging copy and verify counts, administrator recovery, learner sign-in, a course and an uploaded file before relying on the backup. The included regression suite tests migration, restart persistence, rollback and wrong-key failure, but cannot validate your real backup media.

For rollback: stop the new container and restore the complete pre-upgrade data/configuration snapshot with the old image. Do not point the old app at the migrated directory; it would not understand the new database. Retain any post-upgrade records for deliberate reconciliation.

## Recovery and operational limits

- Forgot the admin password: choose a new random `ADMIN_RESET_TOKEN`, restart, and read the new `data/.admin_setup_password`. A new token is consumed once. Remove the reset variable afterward. If auth metadata itself is corrupt, stop and restore the last valid credential file first; do not delete customer data.
- Learners recover access using their saved recovery code and a new password. Recovery rotates the code and invalidates their old sessions. Email ownership is not automatically verified; a certificate records the learner's account name and course completion, not government identity.
- Course videos hosted outside this app must have access controls appropriate to your licensing. The app gates its own referenced paid uploads and hides non-preview URLs from unenrolled users; it cannot change a third-party public video host.
- The transactional document store is intended for this single-server deployment, not unrestricted enterprise scale. Large historical collections still require proportional JSON serialization. Monitor CPU, disk space and p95 response time; move to normalized indexed tables/Postgres before sustained high concurrency or multiple replicas. Do not confuse a clean dependency audit with proof of absence of all vulnerabilities.

## Development and release checks

```bash
npm ci
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=moderate
```

`lint` now checks frontend and backend. CI runs these checks and builds the Docker image. `dist/client` is the only public static root; `dist/server/server.cjs` is private. Run the live configuration and restore checks above before declaring the deployed instance production-ready.
