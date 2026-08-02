# ── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Install server deps + build
RUN npm ci --workspace=server --workspace=shared

# Build client
WORKDIR /app/client
RUN npm ci && npm run build

# ── Production Stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/package.json ./client/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run Prisma migrations then start
CMD cd /app/server && npx prisma migrate deploy && node dist/index.js