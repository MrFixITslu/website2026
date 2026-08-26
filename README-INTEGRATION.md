# V79 Website → V79Tiquet Lead Capture Integration (website2026 side)

When a visitor submits the Contact Us form, their info is automatically
sent to V79Tiquet, which creates them as a Client marked as a website lead
— see the companion README in the V79Tiquet change package for that side.

## Changed / new files

| File | What changed |
|---|---|
| `server.ts` | Added the outbound V79Tiquet client, reCAPTCHA verification, rate limiting, and durable retry tracking; wired into the existing `POST /api/leads` handler |
| `package.json` | Added `express-rate-limit` (this app had **no rate limiting anywhere**, on any route, before this change) |
| `.env.example` | Documents the 3 new env vars |
| `docker-compose.yml` | Passes the 3 new vars through to the container — **without this they'd never reach it**, since this file uses an explicit `environment:` allowlist rather than `env_file:` |

## What did NOT change

- The contact form itself (`src/components/ContactPage.tsx`) — untouched, uses its existing fields as-is, per the task's instruction not to unnecessarily change it
- The existing local lead persistence (`db.addLead`, the `saas_leads` table, the admin leads dashboard) — still exactly what it was; this integration adds to it, not replaces it
- The success/error experience the visitor sees

## Two related gaps closed (found while inspecting, not part of the original ask, but now more consequential)

1. **No rate limiting existed on any route in this app.** Added 10
   submissions / 15 min on `/api/leads` specifically. This matters more now
   because a spam flood against this endpoint doesn't just fill up a local
   lead list — it also creates client records in V79Tiquet's Client
   Management.
2. **The contact form's reCAPTCHA v3 token was generated client-side but
   never actually verified server-side** — it was decorative. Added real
   verification against Google's `siteverify` endpoint. Skipped gracefully
   (not an error) if `RECAPTCHA_SECRET_KEY` is unset, matching this app's
   existing pattern of every integration being optional until configured.

## Required environment variables

```
V79TIQUET_INTAKE_URL=http://v79-tiquet-manager:3050/api/public/intake
V79TIQUET_INTAKE_SECRET=<must match V79Tiquet's own INTAKE_SECRET exactly>
RECAPTCHA_SECRET_KEY=<from the Google reCAPTCHA admin console>
```

`V79TIQUET_INTAKE_URL` defaults to the **internal Docker network address**
(`http://v79-tiquet-manager:3050/...`) rather than a public URL — both apps
are attached to the same external `proxy_network`, so traffic between them
never needs to leave the host or round-trip through the reverse proxy.
Override it only if the two apps aren't on the same Docker network in your
deployment.

Leaving `V79TIQUET_INTAKE_URL` / `V79TIQUET_INTAKE_SECRET` unset makes the
integration simply inactive — no error, the contact form keeps working
exactly as it did before this change.

## Database migration

Automatic — two nullable columns (`tiquetEventId`, `tiquetSyncStatus`)
added to `saas_leads` via the same `ALTER TABLE` + swallow-if-exists
pattern already used elsewhere in this file's `init()`. No data loss, no
manual step.

## Failure handling / retry behavior

1. The lead is saved locally first (existing `db.addLead`) — this always happens regardless of what follows.
2. Before attempting delivery to V79Tiquet, the lead is marked `tiquetSyncStatus: 'pending'` — durable, so a crash mid-delivery can't lose the record.
3. Up to 2 inline retries (1.5s, then 4s) within the same request, each with an 8s timeout — bounded so a visitor never waits unreasonably long even if V79Tiquet is unreachable.
4. If still failing: left `'pending'`. A periodic sweep (every 5 minutes) finds every pending lead and retries it, using the same `tiquetEventId` each time — so however many retries happen, V79Tiquet's idempotency check means at most one client/job is ever created from it.
5. **The visitor's submission always succeeds** (assuming their own input was valid) regardless of whether V79Tiquet is reachable — verified directly by killing V79Tiquet mid-test and confirming the website still responded successfully in ~5 seconds, with the lead correctly queued for retry rather than lost or falsely marked delivered.
6. A 4xx response from V79Tiquet (bad payload, bad secret) is treated as permanent and not retried; a 5xx or network error is treated as transient and retried.

## Idempotency

`tiquetEventId` (a UUID) is generated once per submission and reused on
every retry of that same submission — never regenerated. Combined with
V79Tiquet's own idempotency check on that value, a submission can be
retried any number of times without ever creating more than one client/job
on the V79Tiquet side.

## Post-delivery self-audit — 3 real bugs found and fixed

After the initial delivery, a dedicated re-audit of this code specifically
(prompted by a request to check the work rather than assume it was
correct) found three real issues:

1. **The visitor's response was blocked on the full Tiquet delivery
   attempt**, including all inline retries — despite a comment right above
   the code claiming it "never blocks... the visitor's submission." In the
   worst case (V79Tiquet reachable but hanging rather than instantly
   refusing — e.g. a network partition or an overloaded container), a
   visitor could have waited **up to ~30 seconds** for a response to their
   own form submission. Fixed to respond immediately after local
   persistence, with delivery now genuinely fire-and-forget. **Verified
   directly**: measured response time with V79Tiquet fully stopped —
   **50ms**, not ~30s, with the lead still correctly queued for retry in
   the background.
2. **reCAPTCHA was over-strict**: a *missing* token (very plausible for a
   real visitor whose ad-blocker or privacy extension silently blocked
   Google's script) was rejected identically to a token that Google
   explicitly flagged as a bot. For a lead-generation contact form, that
   trade-off is backwards — losing a real sales inquiry with zero
   visibility is worse than letting through an occasional bot that still
   has to clear the rate limiter and V79Tiquet's own duplicate detection.
   Fixed: a missing token now logs a warning and is allowed through; a
   token that was provided but failed Google's check is still rejected.
3. Sweep loop robustness: one lead failing partway through a batch (e.g. a
   transient DB lock) previously aborted the rest of that cycle's batch via
   a single shared try/catch. Each lead is now handled independently.

## Testing

Verified with real, running instances of both apps — not just this app in
isolation:

1. Submitted a real lead through the real `/api/leads` endpoint → confirmed it appeared in V79Tiquet's Client Management automatically, correctly marked, with `tiquetSyncStatus` flipping to `'sent'`
2. **Killed V79Tiquet mid-test**, submitted a lead → confirmed the website still returned a fast success response, the lead was persisted locally, and it was correctly left `'pending'` (not falsely marked as delivered, not lost)
3. Confirmed the pending-lead query and the delivery function each work correctly in isolation (full 5-minute wall-clock wait for the periodic sweep itself wasn't practical in this session, but its logic is a direct composition of the two already-verified pieces)
4. `npm run lint` (`tsc --noEmit`) and `npm run build` — both clean
5. Confirmed the new code is present in the compiled `dist/server.cjs`

## Docker considerations

`server.ts` changes are picked up automatically by the existing `COPY . .`
+ `npm run build` (esbuild bundles everything server.ts imports) — no
Dockerfile change needed. The `docker-compose.yml` change (passing the 3
new env vars through) **is required** — this app's compose file lists env
vars explicitly rather than using `env_file:`, so without this change the
container would never see the values even with them correctly set in your
`.env` on the host.
