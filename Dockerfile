# ── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Install root + workspace deps
RUN npm ci

# Build server TypeScript (server workspace deps installed via npm ci)
WORKDIR /app/server
RUN npm run build

# Build client
WORKDIR /app/client
RUN npm ci && npm run build

# ── Production Stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy root node_modules (workspace deps hoisted)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy built server
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Copy shared + client
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/package.json ./client/

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_URL=http://localhost:3000

EXPOSE 3001

# Prisma CLI is hoisted to root node_modules/.bin by npm ci (workspaces)
CMD cd /app/server && ../node_modules/.bin/prisma migrate deploy && cd /app && node server/dist/index.js
