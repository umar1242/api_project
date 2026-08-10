#!/bin/bash
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
echo "Bots started!"
wait
