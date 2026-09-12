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

## Deployment & Verifying Freshness

### 1. Verify Currently Running Version
You can check if your live server is running the newest code at any time by calling:
```bash
curl https://<your-domain>/api/version
```
This returns the current active build version, server start timestamp, and uptime.

### 2. Docker / Docker Compose Deployment
When updating your server via Docker, **always use the `--build` flag** so Docker rebuilds the images rather than reusing stale cached layers:
```bash
docker compose up -d --build
```
Or to force a completely clean build:
```bash
docker compose build --no-cache && docker compose up -d
```

### 3. Client & Proxy Cache Busting
All HTML endpoints (`index.html` and `admin.html`) send strict HTTP anti-caching headers (`no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`), guaranteeing that browsers and reverse proxies (such as Nginx or Cloudflare) never serve stale cached HTML. Vite assets are built with content hashes (`/assets/*-[hash].js`) ensuring automatic cache invalidation on new deployments.
