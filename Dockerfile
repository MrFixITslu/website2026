# Multi-stage production Dockerfile
# Stage 1: Build the frontend and backend server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the entire project code
COPY . .

# Build the static frontend bundle and the server
RUN npm run build

# Stage 2: Create the minimal production runner image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Expose default port (internally)
ENV PORT=3010

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from stage 1
COPY --from=builder /app/dist ./dist

# Copy the JSON data files (they act as the database)
COPY --from=builder /app/vision79_saas.json ./
COPY --from=builder /app/vision79_ads.json ./

# Create writable data/uploads directories and drop root privileges
RUN mkdir -p /app/data /app/uploads && \
    chown -R node:node /app
USER node

# Expose the internal port
EXPOSE 3000

# Start the Node server
CMD ["npm", "run", "start"]
