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

