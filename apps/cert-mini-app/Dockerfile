# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage: development
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# For Vite we need host mode so it is accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host"]

# Stage: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage: production
FROM nginx:alpine AS production
# Copy built files to nginx serve directory
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx configuration if you want to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
