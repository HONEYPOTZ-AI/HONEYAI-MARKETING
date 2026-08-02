# ── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Install all workspace deps
RUN npm ci

# Build server TypeScript
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

# Copy built server artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Copy shared + client
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/package.json ./client/

# Install prisma CLI globally for migrations
RUN npm install -g prisma@5

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_URL=http://localhost:3000

EXPOSE 3001

CMD prisma migrate deploy --schema=server/prisma/schema.prisma && node server/dist/index.js
