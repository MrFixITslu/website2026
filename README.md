<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/18f30f03-e9f4-4915-aafc-1da768316a7f

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Deployment with Docker & Nginx Proxy Manager

### 1. External Network (`proxy_network`)
The `docker-compose.yml` is configured to join the existing external Docker bridge network named `proxy_network`:

```bash
# If proxy_network does not already exist on your Docker host, create it once:
docker network create proxy_network
```

### 2. Deploy or Update the Container
To deploy the latest code without stale cache layers:

```bash
# Force rebuild without cache and restart container attached to proxy_network
docker compose build --no-cache && docker compose up -d
```

### 3. Nginx Proxy Manager / Reverse Proxy Configuration
In your Nginx Proxy Manager (or reverse proxy) dashboard:
- **Domain Names**: `v79sl.com`, `www.v79sl.com`
- **Scheme**: `http`
- **Forward Hostname / IP**: `V79website` (or container IP on `proxy_network`)
- **Forward Port**: `3000`
- **Block Common Exploits**: ON
- **Websockets Support**: ON
- **SSL**: Force SSL / HTTP to HTTPS redirect

### 4. Verify Active Deployment
Check that your server is running the newest build:
```bash
curl -i https://v79sl.com/api/version
```

## Admin Login

- On first-ever run, the server generates its own initial admin password and prints it to the container logs (`docker compose logs V79website`). You'll be required to set a permanent password immediately after your first login.
- The admin console lives at `/admin` (e.g. `https://v79sl.com/admin`).

### Locked out? One-time password reset

If you can't log in and don't know the current password:

1. In your `.env`, set `ADMIN_RESET_TOKEN` to any new value (e.g. `openssl rand -hex 8`, or just today's date).
2. Restart the container: `docker compose up -d --build`.
3. Check the logs for the new one-time password:
   ```bash
   docker compose logs V79website | grep -A2 "One-time password"
   ```
   (Or set `ADMIN_PASSWORD` in `.env` at the same time to choose the new password yourself instead of using a generated one.)
4. Log in at `/admin` with that password. You'll be forced to set a permanent password before doing anything else.

It's safe to leave `ADMIN_RESET_TOKEN` set afterwards — the reset only fires once per distinct token value, so it won't undo the password you just chose on a later restart. To reset again in the future, just change it to a different value.
