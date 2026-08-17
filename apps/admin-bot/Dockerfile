# Stage: dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/admin-bot/package.json ./apps/admin-bot/
COPY packages/bot-core ./packages/bot-core
RUN npm install --workspace=apps/admin-bot --workspace=packages/bot-core --include-workspace-root --no-audit --no-fund
RUN npx tsc -p packages/bot-core

# Stage: development
FROM node:22-alpine AS dev
RUN apk add --no-cache openssl
WORKDIR /app/apps/admin-bot
COPY --from=deps /app/node_modules /app/node_modules
COPY packages/bot-core /app/packages/bot-core
COPY apps/admin-bot /app/apps/admin-bot
CMD ["npm", "run", "start:dev"]

# Stage: build
FROM node:22-alpine AS build
WORKDIR /app/apps/admin-bot
COPY --from=deps /app/node_modules /app/node_modules
COPY packages/bot-core /app/packages/bot-core
COPY apps/admin-bot /app/apps/admin-bot
RUN npm run build

# Stage: production
FROM node:22-alpine AS production
WORKDIR /app/apps/admin-bot
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
COPY --from=build --chown=appuser:appgroup /app/apps/admin-bot/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules /app/node_modules
COPY --from=build --chown=appuser:appgroup /app/packages/bot-core /app/packages/bot-core
COPY --from=build --chown=appuser:appgroup /app/apps/admin-bot/package.json ./
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
