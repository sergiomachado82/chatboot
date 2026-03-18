# ============================================
# Chatboot - Multi-stage Dockerfile
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

# Root dependencies (frontend)
COPY package.json package-lock.json ./
RUN npm ci

# Server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# --- Stage 2: Build frontend + generate Prisma client ---
FROM deps AS build
WORKDIR /app

# Copy all source code
COPY . .

# Build frontend (tsc -b && vite build → output in /app/dist)
RUN npm run build

# Generate Prisma client
RUN cd server && npx prisma generate

# --- Stage 3: Production image ---
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling + tzdata for timezone support
RUN apk add --no-cache dumb-init tzdata

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server source (tsx runs TypeScript directly)
COPY --from=build /app/server/src ./server/src
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/tsconfig.json ./server/
COPY --from=build /app/server/prisma ./server/prisma

# Copy shared types (needed for @shared path alias)
COPY --from=build /app/shared ./shared

# Copy server node_modules (includes tsx, prisma client, all deps)
COPY --from=build /app/server/node_modules ./server/node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S chatboot -u 1001 -G nodejs

USER chatboot

EXPOSE 5050

WORKDIR /app/server

# Use dumb-init to handle signals properly
# 1. Run Prisma migrations
# 2. Start server with tsx (handles TypeScript + path aliases)
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]
