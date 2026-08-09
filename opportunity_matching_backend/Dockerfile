# syntax=docker/dockerfile:1

# Build stage: install deps, generate Prisma client, compile TS
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install OS deps needed by Prisma engines and native modules
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Use npm ci if lockfile exists, otherwise fallback to npm install
RUN npm ci || npm install

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Dev runtime stage (hot-reload with ts-node-dev)
FROM node:20-bookworm-slim AS dev
WORKDIR /app
ENV NODE_ENV=production

# Install minimal OS deps required by Prisma engines
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

# Copy node modules from builder (includes Prisma CLI and generated client)
COPY --from=builder /app/node_modules ./node_modules

# Minimal files required at runtime; source will be bind-mounted in compose
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Expose the app port
EXPOSE 4000

# Generate Prisma client and try migrations (non-fatal), then start dev server
CMD ["sh", "-c", "npx prisma generate && (npx prisma migrate deploy || echo 'Skipping migrate deploy in dev') && npm run dev"]
