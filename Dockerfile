# ==============================================================================
# Multi-Stage Dockerfile for Vision79 Digital Web Application
# Node 20 LTS Alpine ensures fast, lightweight, and secure container images.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend and Backend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Clean install all dependencies (including devDependencies required for vite & esbuild)
RUN npm ci

# Copy project source
COPY . .

# Run production build (compiles Vite SPA + esbuild bundles server.cjs)
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Copy dependency manifests and install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

# Ensure runtime upload and data directories exist
RUN mkdir -p /app/uploads /app/data

# Healthcheck to verify the server is actively responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
