#!/bin/bash
echo "Stopping old tunnels..."
pkill -f "serveo.net"
pkill -f "./cloudflared tunnel"

echo "Starting serveo tunnels..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:127.0.0.1:5173 serveo.net > admin_serveo.log 2>&1 &
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:127.0.0.1:5174 serveo.net > cert_serveo.log 2>&1 &
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:127.0.0.1:5176 serveo.net > hw_serveo.log 2>&1 &

echo "Waiting 10 seconds for serveo to allocate subdomains..."
sleep 10

ADMIN_URL=$(grep -oE 'https://[A-Za-z0-9.-]+\.serveo\.net' admin_serveo.log | head -n 1)
CERT_URL=$(grep -oE 'https://[A-Za-z0-9.-]+\.serveo\.net' cert_serveo.log | head -n 1)
HW_URL=$(grep -oE 'https://[A-Za-z0-9.-]+\.serveo\.net' hw_serveo.log | head -n 1)

echo "Admin: $ADMIN_URL"
echo "Cert: $CERT_URL"
echo "Homework: $HW_URL"

# Update .env
sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env
sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env
sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env

echo "Done!"
