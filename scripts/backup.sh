#!/bin/bash
# Backup PostgreSQL Database
# Usage: ./scripts/backup.sh

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-botnet_prod}
COMPOSE_FILE="docker-compose.prod.yml"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

# Use docker compose exec to run pg_dump inside the db container
docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "/tmp/db_backup_$TIMESTAMP.dump"

# Copy the backup from container to host
docker compose -f "$COMPOSE_FILE" cp db:"/tmp/db_backup_$TIMESTAMP.dump" "$BACKUP_DIR/db_backup_$TIMESTAMP.dump"

# Remove the temp file inside container
docker compose -f "$COMPOSE_FILE" exec -T db rm "/tmp/db_backup_$TIMESTAMP.dump"

echo "Backup completed: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"

# Keep only backups from the last 7 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -exec rm {} \;
echo "Old backups cleaned up."
