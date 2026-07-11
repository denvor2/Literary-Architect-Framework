# Sprint-22-Step-01: Multi-stage Dockerfile for Literary Studio.
# Stage 1 (builder): install deps + build. Stage 2 (runner): copy + run.

FROM node:20-alpine AS base

# --- Builder stage ---
FROM base AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Runner stage ---
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy node_modules from builder (required for prisma migrate deploy)
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema and migrations (required for database schema setup)
COPY --from=builder /app/prisma ./prisma

# Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script that runs migrations and starts the server
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Entrypoint script runs prisma migrate deploy before starting the server
ENTRYPOINT ["./entrypoint.sh"]
