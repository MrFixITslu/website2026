# Website → V79Tiquet lead delivery

Set `V79TIQUET_INTAKE_URL` and `V79TIQUET_INTAKE_SECRET` on the website. The server POSTs contact details to that operator-configured endpoint using `X-Intake-Secret` and a stable random `eventId`.

Local lead, CRM activity and pending outbox status are committed together before the public request succeeds. A contact form submission includes an idempotency key; retrying it does not create another local lead. The receiving Tiquet service must also deduplicate by eventId, because a lost response can require replay.

Statuses:

- `sent`: receiver returned a successful HTTP status.
- `pending`: a timeout, network problem, 408/429 or server error needs retry; the periodic sweep runs every five minutes.
- `failed`: other HTTP 4xx rejection; correct configuration/payload and replay manually.
- `disabled`: URL or secret absent; it has not been delivered. Once configured, the sweep can pick it up.

Admin → CRM → Enrollment and delivery queue exposes pending/failed/disabled records and retry controls. Simultaneous sends for the same event are coalesced within the single server process. A successful response from the receiver means accepted by that receiver; validate the receiver's own durable processing separately.

CAPTCHA enforcement and trusted proxy configuration affect abuse protection. See [PRODUCTION.md](PRODUCTION.md). No authentication secrets or PII should appear in integration logs or image layers.
