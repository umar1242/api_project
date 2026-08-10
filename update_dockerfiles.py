import os

apps = [
    'admin-mini-app',
    'cert-mini-app',
    'main-mini-app',
    'homework-mini-app',
    'material-mini-app'
]

dockerfile_template = """# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/{app_name}/package.json ./apps/{app_name}/
COPY packages/shared-ui/package.json ./packages/shared-ui/
RUN npm install --workspace=apps/{app_name} --include-workspace-root --no-audit --no-fund

# Stage: development
FROM node:22-alpine AS dev
WORKDIR /app/apps/{app_name}
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared-ui/node_modules /app/packages/shared-ui/node_modules || true
COPY packages/shared-ui /app/packages/shared-ui
COPY apps/{app_name} /app/apps/{app_name}
CMD ["npm", "run", "dev", "--", "--host"]

# Stage: build
FROM node:22-alpine AS builder
WORKDIR /app/apps/{app_name}
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/shared-ui/node_modules /app/packages/shared-ui/node_modules || true
COPY packages/shared-ui /app/packages/shared-ui
COPY apps/{app_name} /app/apps/{app_name}
RUN npm run build

# Stage: production
FROM nginx:alpine AS production
COPY --from=builder /app/apps/{app_name}/dist /usr/share/nginx/html
COPY apps/{app_name}/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""

base_dir = "/home/umariko/Desktop/бот с единой API системой"

for app in apps:
    df_path = os.path.join(base_dir, 'apps', app, 'Dockerfile')
    with open(df_path, 'w') as f:
        f.write(dockerfile_template.replace('{app_name}', app))
    print(f"Updated Dockerfile for {app}")
