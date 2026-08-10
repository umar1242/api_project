#!/bin/bash
echo "Stopping old tunnels..."
pkill -f "./cloudflared tunnel"

echo "Starting cloudflared tunnels..."
./cloudflared tunnel --url http://127.0.0.1:5173 > admin_cf.log 2>&1 &
ADMIN_PID=$!
./cloudflared tunnel --url http://127.0.0.1:5174 > cert_cf.log 2>&1 &
CERT_PID=$!
./cloudflared tunnel --url http://127.0.0.1:5176 > hw_cf.log 2>&1 &
HW_PID=$!

echo "Waiting for tunnels to initialize (takes about 10 seconds)..."
sleep 12

ADMIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' admin_cf.log | head -n 1)
CERT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cert_cf.log | head -n 1)
HW_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' hw_cf.log | head -n 1)

echo "Admin: $ADMIN_URL"
echo "Cert: $CERT_URL"
echo "Homework: $HW_URL"

# Update .env
sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env
sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env
sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env

echo "Restarting bots..."
# bots will be manually restarted by agent
echo "Done!"
