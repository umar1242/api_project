#!/bin/bash
set -e

echo "Skipping Docker containers (permission issues, assuming DB is already running)..."
echo "Waiting for DB to be ready..."
sleep 5

echo "Starting Core API on port 3001..."
cd apps/api
export PORT=3001
nohup npm run start:dev > ../../core-api.log 2>&1 &
cd ../..

echo "Starting Vite Mini Apps..."
cd apps/admin-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5173 > ../../admin-vite.log 2>&1 &
cd ../..
cd apps/cert-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5174 > ../../cert-vite.log 2>&1 &
cd ../..
cd apps/registrar-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5175 > ../../registrar-vite.log 2>&1 &
cd ../..
cd apps/homework-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5176 > ../../hw-vite.log 2>&1 &
cd ../..
cd apps/main-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5177 > ../../main-vite.log 2>&1 &
cd ../..
cd apps/material-mini-app
nohup npm run dev -- --host 127.0.0.1 --port 5178 > ../../material-vite.log 2>&1 &
cd ../..

echo "Starting Cloudflare Tunnels..."
nohup ./cloudflared tunnel --url http://127.0.0.1:5173 > admin_cf.log 2>&1 &
nohup ./cloudflared tunnel --url http://127.0.0.1:5174 > cert_cf.log 2>&1 &
nohup ./cloudflared tunnel --url http://127.0.0.1:5175 > registrar_cf.log 2>&1 &
nohup ./cloudflared tunnel --url http://127.0.0.1:5176 > hw_cf.log 2>&1 &
nohup ./cloudflared tunnel --url http://127.0.0.1:5177 > main_cf.log 2>&1 &
nohup ./cloudflared tunnel --url http://127.0.0.1:5178 > material_cf.log 2>&1 &

echo "Waiting for tunnels to establish (up to 40s)..."
for i in {1..20}; do
  ADMIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' admin_cf.log | head -n 1 || true)
  CERT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cert_cf.log | head -n 1 || true)
  REG_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' registrar_cf.log | head -n 1 || true)
  HW_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' hw_cf.log | head -n 1 || true)
  MAIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' main_cf.log | head -n 1 || true)
  MAT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' material_cf.log | head -n 1 || true)
  
  if [ -n "$ADMIN_URL" ] && [ -n "$CERT_URL" ] && [ -n "$REG_URL" ] && [ -n "$HW_URL" ] && [ -n "$MAIN_URL" ] && [ -n "$MAT_URL" ]; then
    break
  fi
  sleep 2
done

if [ -n "$ADMIN_URL" ]; then sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env; fi
if [ -n "$CERT_URL" ]; then sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env; fi
if [ -n "$REG_URL" ]; then sed -i "s|REGISTRAR_WEBAPP_URL=.*|REGISTRAR_WEBAPP_URL=$REG_URL|" .env; fi
if [ -n "$HW_URL" ]; then sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env; fi
if [ -n "$MAIN_URL" ]; then sed -i "s|MAIN_WEBAPP_URL=.*|MAIN_WEBAPP_URL=$MAIN_URL|" .env; fi
if [ -n "$MAT_URL" ]; then sed -i "s|MATERIAL_WEBAPP_URL=.*|MATERIAL_WEBAPP_URL=$MAT_URL|" .env; fi

echo "Starting Telegram Bots..."
sleep 5

set -a
source .env
set +a
export API_BASE_URL=http://localhost:3001

for bot in admin-bot cert-bot homework-bot registrar-bot main-bot material-bot; do
  echo "Starting $bot..."
  cd apps/$bot
  nohup npm run start:dev > ../../${bot}.log 2>&1 &
  cd ../..
done

echo "All services started! You can check the logs in .log files."
tail -f /dev/null

