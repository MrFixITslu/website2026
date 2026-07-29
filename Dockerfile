FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies if needed for native modules like sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# sqlite3 is a native module - keep build tools in the runner stage too,
# since `npm install --production` still needs to compile/verify bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/admin.html ./admin.html
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/data ./data

# Persisted at runtime via the docker-compose volume mount, but create it
# so the app has somewhere to write before the first upload happens
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
