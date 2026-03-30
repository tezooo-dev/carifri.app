# ── Stage 1: Build frontend ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build          # outputs to /app/dist

# ── Stage 2: Production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy server source + dependencies
COPY server/ ./server/
COPY package*.json ./

# Install only production deps (for server)
RUN npm ci --omit=dev

# Copy built frontend to be served by nginx (or express static)
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/server/data && chown -R node:node /app

ENV NODE_ENV=production
ENV API_PORT=3001

EXPOSE 3001

USER node

CMD ["node", "server/index.js"]
