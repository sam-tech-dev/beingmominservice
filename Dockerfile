# ============================================================
# Stage 1 — builder
# Install ALL dependencies (including devDeps).
# Node 22 LTS Alpine: stable, well-audited, smaller than Node 25.
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer.
# If package.json hasn't changed, npm ci is skipped on rebuild.
COPY package.json package-lock.json ./

# npm ci: reproducible install from package-lock.json, fails if out of sync.
RUN npm ci

# ============================================================
# Stage 2 — production
# Start fresh. Copy only what the running app needs.
# Result: no nodemon, no npm cache, smaller image.
# ============================================================
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy dependency tree from builder — no re-download from npm.
COPY --from=builder /app/node_modules ./node_modules

# Copy only source that the app needs at runtime.
# uploads/ is excluded — files go directly to S3.
# .env is excluded (secrets come from Kubernetes at runtime).
COPY bin/ ./bin/
COPY src/ ./src/
COPY package.json ./

# Run as the non-root `node` user shipped with node:alpine.
# Running as root inside a container is a security anti-pattern.
USER node

EXPOSE 3000

# Exec form (JSON array) makes node PID 1 so SIGTERM from kubectl reaches it.
# Shell form would spawn /bin/sh -c and signals would not forward.
CMD ["node", "./bin/www"]
