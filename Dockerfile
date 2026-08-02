# ── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Install all workspace deps (this hoists everything to root node_modules)
RUN npm ci

# Build server TypeScript
WORKDIR /app/server
RUN npm run build

# Build client (no need for second npm ci, all deps are already hoisted)
WORKDIR /app/client
RUN npm run build

# ── Production Stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root node_modules (all workspace deps hoisted here)
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
