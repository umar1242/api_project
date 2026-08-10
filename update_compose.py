import yaml

with open('docker-compose.yml', 'r') as f:
    compose = yaml.safe_load(f)

apps_to_update = [
    'admin-mini-app',
    'cert-mini-app',
    'main-mini-app',
    'homework-mini-app',
    'material-mini-app'
]

for app in apps_to_update:
    if app in compose['services']:
        svc = compose['services'][app]
        if 'build' in svc:
            svc['build']['context'] = '.'
            svc['build']['dockerfile'] = f'./apps/{app}/Dockerfile'
            
        # Update volumes if necessary?
        # The volumes are like - ./apps/main-mini-app:/app
        # But wait, inside dev stage, WORKDIR is /app/apps/main-mini-app
        # Wait, if WORKDIR is /app/apps/main-mini-app, and volumes mount ./apps/main-mini-app to /app, it will be mapped wrong!
        # If I mount `- .:/app`, it maps the whole repo!
        # But I don't want to map the whole repo because that maps host node_modules which break things.
        # Actually, let's just leave volumes as `- ./apps/main-mini-app:/app/apps/main-mini-app` and `- ./packages/shared-ui:/app/packages/shared-ui`
        volumes = svc.get('volumes', [])
        new_volumes = []
        for vol in volumes:
            if vol == f'./apps/{app}:/app':
                new_volumes.append(f'./apps/{app}:/app/apps/{app}')
                new_volumes.append(f'./packages/shared-ui:/app/packages/shared-ui')
            elif vol == '/app/node_modules':
                new_volumes.append(f'/app/apps/{app}/node_modules')
            else:
                new_volumes.append(vol)
        svc['volumes'] = new_volumes

with open('docker-compose.yml', 'w') as f:
    yaml.dump(compose, f, sort_keys=False)
    
print("Updated docker-compose.yml")
