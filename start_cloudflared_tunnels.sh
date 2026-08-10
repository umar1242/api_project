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

echo "Waiting for tunnels to initialize (takes about 15 seconds)..."
sleep 15

ADMIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' admin_cf.log | head -n 1)
MAIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' main_cf.log | head -n 1)
HW_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' hw_cf.log | head -n 1)
MATERIAL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' material_cf.log | head -n 1)
CERT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cert_cf.log | head -n 1)
REGISTRAR_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' registrar_cf.log | head -n 1)

echo "Admin: $ADMIN_URL"
echo "Main: $MAIN_URL"
echo "Homework: $HW_URL"
echo "Material: $MATERIAL_URL"
echo "Cert: $CERT_URL"
echo "Registrar: $REGISTRAR_URL"

# Update .env
sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env
sed -i "s|MAIN_WEBAPP_URL=.*|MAIN_WEBAPP_URL=$MAIN_URL|" .env
sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env
sed -i "s|MATERIAL_WEBAPP_URL=.*|MATERIAL_WEBAPP_URL=$MATERIAL_URL|" .env
sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env
sed -i "s|REGISTRAR_WEBAPP_URL=.*|REGISTRAR_WEBAPP_URL=$REGISTRAR_URL|" .env

echo "Restarting bots via Docker Compose..."
sudo docker compose up -d
echo "Done!"
