# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Development target (used by docker-compose dev) ───────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "start:dev"]

# ── Production target ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
