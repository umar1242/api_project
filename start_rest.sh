#!/bin/bash
set -e

echo "Starting Core API..."
cd apps/api
npm run start:dev > ../../core-api.log 2>&1 &
cd ../..

echo "Starting Vite Mini Apps..."
cd apps/admin-mini-app
npm run dev -- --host 127.0.0.1 --port 5173 > ../../admin-vite.log 2>&1 &
cd ../..

cd apps/cert-mini-app
npm run dev -- --host 127.0.0.1 --port 5174 > ../../cert-vite.log 2>&1 &
cd ../..

cd apps/homework-mini-app
npm run dev -- --host 127.0.0.1 --port 5176 > ../../hw-vite.log 2>&1 &
cd ../..

cd apps/registrar-mini-app
npm run dev -- --host 127.0.0.1 --port 5175 > ../../registrar-vite.log 2>&1 &
cd ../..

cd apps/main-mini-app
npm run dev -- --host 127.0.0.1 --port 5177 > ../../main-vite.log 2>&1 &
cd ../..

cd apps/material-mini-app
npm run dev -- --host 127.0.0.1 --port 5178 > ../../material-vite.log 2>&1 &
cd ../..

echo "Starting Cloudflare Tunnels..."
./cloudflared tunnel --url http://127.0.0.1:5173 > admin_cf.log 2>&1 &
./cloudflared tunnel --url http://127.0.0.1:5174 > cert_cf.log 2>&1 &
./cloudflared tunnel --url http://127.0.0.1:5176 > hw_cf.log 2>&1 &
./cloudflared tunnel --url http://127.0.0.1:5175 > registrar_cf.log 2>&1 &
./cloudflared tunnel --url http://127.0.0.1:5177 > main_cf.log 2>&1 &
./cloudflared tunnel --url http://127.0.0.1:5178 > material_cf.log 2>&1 &

echo "Waiting for tunnels to establish..."
for i in {1..30}; do
  ADMIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' admin_cf.log | head -n 1)
  CERT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cert_cf.log | head -n 1)
  HW_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' hw_cf.log | head -n 1)
  REGISTRAR_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' registrar_cf.log | head -n 1)
  MAIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' main_cf.log | head -n 1)
  MATERIAL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' material_cf.log | head -n 1)
  
  if [ -n "$ADMIN_URL" ] && [ -n "$CERT_URL" ] && [ -n "$HW_URL" ] && [ -n "$REGISTRAR_URL" ] && [ -n "$MAIN_URL" ] && [ -n "$MATERIAL_URL" ]; then
    break
  fi
  sleep 2
done

echo "Admin: $ADMIN_URL"
echo "Cert: $CERT_URL"
echo "Homework: $HW_URL"
echo "Registrar: $REGISTRAR_URL"
echo "Main: $MAIN_URL"
echo "Material: $MATERIAL_URL"

sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env
sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env
sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env
sed -i "s|REGISTRAR_WEBAPP_URL=.*|REGISTRAR_WEBAPP_URL=$REGISTRAR_URL|" .env
sed -i "s|MAIN_WEBAPP_URL=.*|MAIN_WEBAPP_URL=$MAIN_URL|" .env
sed -i "s|MATERIAL_WEBAPP_URL=.*|MATERIAL_WEBAPP_URL=$MATERIAL_URL|" .env

echo "Starting Telegram Bots..."
cd apps/admin-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../admin-bot.log 2>&1 &'
cd ../..

cd apps/cert-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../cert-bot.log 2>&1 &'
cd ../..

cd apps/homework-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../hw-bot.log 2>&1 &'
cd ../..

cd apps/registrar-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../registrar-bot.log 2>&1 &'
cd ../..

cd apps/main-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../main-bot.log 2>&1 &'
cd ../..

cd apps/material-bot
bash -c 'set -a; source ../../.env; set +a; export API_BASE_URL=http://localhost:3000; npm run start:dev > ../../material-bot.log 2>&1 &'
cd ../..

echo "All services started!"
tail -f /dev/null
