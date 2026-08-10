# Stage: dependencies
FROM node:22-alpine AS deps
# openssl is required by the Prisma query engine on Alpine (musl)
# Alpine 3.17+ ships OpenSSL 3.x; openssl1.1-compat is NOT needed.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Stage: development (hot reload)
FROM node:22-alpine AS dev
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Stage: build
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && npm prune --production

# Stage: production (minimal, non-root)
FROM node:22-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
# Prisma client and schema needed at runtime for migrations
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
