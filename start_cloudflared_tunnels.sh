#!/bin/bash
echo "Stopping old tunnels..."
pkill -f "./cloudflared tunnel"

echo "Starting cloudflared tunnels..."
setsid ./cloudflared tunnel --url http://127.0.0.1:5173 > registrar_cf.log 2>&1 &
setsid ./cloudflared tunnel --url http://127.0.0.1:5174 > main_cf.log 2>&1 &
setsid ./cloudflared tunnel --url http://127.0.0.1:5175 > hw_cf.log 2>&1 &
setsid ./cloudflared tunnel --url http://127.0.0.1:5176 > material_cf.log 2>&1 &
setsid ./cloudflared tunnel --url http://127.0.0.1:5177 > admin_cf.log 2>&1 &
setsid ./cloudflared tunnel --url http://127.0.0.1:5178 > cert_cf.log 2>&1 &

declare -A LOGS=(
    ["REGISTRAR"]="registrar_cf.log"
    ["MAIN"]="main_cf.log"
    ["HOMEWORK"]="hw_cf.log"
    ["MATERIAL"]="material_cf.log"
    ["ADMIN"]="admin_cf.log"
    ["CERT"]="cert_cf.log"
)
declare -A URLS
declare -A ENV_VARS=(
    ["REGISTRAR"]="REGISTRAR_WEBAPP_URL"
    ["MAIN"]="MAIN_WEBAPP_URL"
    ["HOMEWORK"]="HOMEWORK_WEBAPP_URL"
    ["MATERIAL"]="MATERIAL_WEBAPP_URL"
    ["ADMIN"]="ADMIN_WEBAPP_URL"
    ["CERT"]="CERT_WEBAPP_URL"
)

echo "Waiting for tunnels to initialize (up to 45 seconds)..."
TIMEOUT=45
ELAPSED=0
ALL_UP=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    ALL_UP=true
    for key in "${!LOGS[@]}"; do
        if [ -z "${URLS[$key]}" ]; then
            URL=$(grep -a -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "${LOGS[$key]}" | head -n 1)
            if [ -n "$URL" ]; then
                URLS[$key]="$URL"
            else
                ALL_UP=false
            fi
        fi
    done

    if [ "$ALL_UP" = true ]; then
        break
    fi

    sleep 1
    ((ELAPSED++))
done

HAS_ERRORS=false

echo "----------------------------------------"
echo "Tunnel Initialization Summary:"
echo "----------------------------------------"

for key in "REGISTRAR" "MAIN" "HOMEWORK" "MATERIAL" "ADMIN" "CERT"; do
    ENV_VAR="${ENV_VARS[$key]}"
    if [ -n "${URLS[$key]}" ]; then
        echo "OK: $key -> ${URLS[$key]}"
        sed -i "s|^$ENV_VAR=.*|$ENV_VAR=${URLS[$key]}|" .env
    else
        # Check for rate limit error
        if grep -q "429 Too Many Requests" "${LOGS[$key]}"; then
            echo "FAILED: $key ($ENV_VAR) - Cloudflare Rate Limit (429 Too Many Requests). подождите немного перед следующим запуском. .env не изменён"
        else
            echo "FAILED: $key ($ENV_VAR) - не удалось получить URL, .env не изменён"
        fi
        HAS_ERRORS=true
    fi
done
echo "----------------------------------------"

echo "Ensuring all services (including mini-apps) are up..."
sudo docker compose up -d

echo "Waiting for mini-apps to become healthy (up to 60 seconds)..."
MINI_APPS="registrar-mini-app main-mini-app homework-mini-app material-mini-app admin-mini-app cert-mini-app"
HEALTH_TIMEOUT=60
HEALTH_ELAPSED=0
MINI_APPS_HEALTHY=false

while [ $HEALTH_ELAPSED -lt $HEALTH_TIMEOUT ]; do
    ALL_HEALTHY=true
    for app in $MINI_APPS; do
        STATUS=$(sudo docker inspect --format='{{.State.Health.Status}}' "api-${app}-1" 2>/dev/null)
        if [ "$STATUS" != "healthy" ]; then
            ALL_HEALTHY=false
        fi
    done

    if [ "$ALL_HEALTHY" = true ]; then
        MINI_APPS_HEALTHY=true
        break
    fi

    sleep 2
    ((HEALTH_ELAPSED+=2))
done

echo "----------------------------------------"
echo "Mini-App Health Check Summary:"
echo "----------------------------------------"
for app in $MINI_APPS; do
    STATUS=$(sudo docker inspect --format='{{.State.Health.Status}}' "api-${app}-1" 2>/dev/null)
    echo "$app: ${STATUS:-not found}"
done
echo "----------------------------------------"

if [ "$MINI_APPS_HEALTHY" != true ]; then
    echo "ERROR: One or more mini-apps did not become healthy within ${HEALTH_TIMEOUT}s."
    echo "Aborting before restarting bots — will NOT publish broken tunnel links to Telegram."
    echo "Check logs with: sudo docker compose logs --tail 30 <service-name>"
    exit 1
fi

echo "All mini-apps are healthy. Proceeding to restart bots..."

BOT_SERVICES="admin-bot cert-bot homework-bot main-bot material-bot registrar-bot"
echo "Restarting bots via Docker Compose (force recreating to pick up new .env)..."
sudo docker compose up -d --force-recreate $BOT_SERVICES

echo "Waiting a few seconds for bots to start up..."
sleep 5

BOTS_DOWN=false
echo "----------------------------------------"
echo "Bots Status Check:"
echo "----------------------------------------"
for bot in $BOT_SERVICES; do
    IS_RUNNING=$(sudo docker compose ps -q --status running "$bot")
    if [ -z "$IS_RUNNING" ]; then
        echo "FAILED: $bot is not running!"
        echo "Logs for $bot:"
        sudo docker compose logs --tail 10 "$bot"
        echo "----------------------------------------"
        BOTS_DOWN=true
    else
        echo "OK: $bot is running."
    fi
done

echo "Done!"

if [ "$HAS_ERRORS" = true ] || [ "$BOTS_DOWN" = true ]; then
    echo "Warning: One or more tunnels failed to initialize, or bots failed to start."
    exit 1
fi
