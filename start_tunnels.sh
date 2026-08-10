#!/bin/bash
echo "Starting tunnels..."

# Start tunnels and log output
ssh -o StrictHostKeyChecking=no -R 80:localhost:5173 nokey@localhost.run > admin_tunnel.log 2>&1 &
ADMIN_PID=$!
ssh -o StrictHostKeyChecking=no -R 80:localhost:5174 nokey@localhost.run > cert_tunnel.log 2>&1 &
CERT_PID=$!
ssh -o StrictHostKeyChecking=no -R 80:localhost:5176 nokey@localhost.run > homework_tunnel.log 2>&1 &
HW_PID=$!

sleep 5 # Wait for connections

ADMIN_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.lhr\.life' admin_tunnel.log | head -n 1)
CERT_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.lhr\.life' cert_tunnel.log | head -n 1)
HW_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.lhr\.life' homework_tunnel.log | head -n 1)

echo "Admin: $ADMIN_URL"
echo "Cert: $CERT_URL"
echo "Homework: $HW_URL"

# Update .env
sed -i "s|ADMIN_WEBAPP_URL=.*|ADMIN_WEBAPP_URL=$ADMIN_URL|" .env
sed -i "s|CERT_WEBAPP_URL=.*|CERT_WEBAPP_URL=$CERT_URL|" .env
sed -i "s|HOMEWORK_WEBAPP_URL=.*|HOMEWORK_WEBAPP_URL=$HW_URL|" .env

echo "Restarting bots..."
# Stop bots (if they are running via npm run start:dev they will be restarted automatically by ts-node-dev when we touch the config, or we can just kill and restart them via the agent, but actually ts-node-dev might not pick up .env changes without restart. We'll restart them manually).

echo "Done! The tunnels are running in the background."
