# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/main-mini-app/package.json ./apps/main-mini-app/
COPY packages/shared-ui/package.json ./packages/shared-ui/
RUN npm install --workspace=apps/main-mini-app --include-workspace-root --no-audit --no-fund
RUN mkdir -p /app/packages/shared-ui/node_modules

# Stage: development
FROM node:22-alpine AS dev
WORKDIR /app/apps/main-mini-app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared-ui/node_modules /app/packages/shared-ui/node_modules
COPY packages/shared-ui /app/packages/shared-ui
COPY apps/main-mini-app /app/apps/main-mini-app
CMD ["npm", "run", "dev", "--", "--host"]

# Stage: build
FROM node:22-alpine AS builder
WORKDIR /app/apps/main-mini-app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared-ui/node_modules /app/packages/shared-ui/node_modules
COPY packages/shared-ui /app/packages/shared-ui
COPY apps/main-mini-app /app/apps/main-mini-app
RUN npm run build

# Stage: production
FROM nginx:alpine AS production
COPY --from=builder /app/apps/main-mini-app/dist /usr/share/nginx/html
COPY apps/main-mini-app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
