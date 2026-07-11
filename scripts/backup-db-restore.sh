#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 backups/backup-literary_studio-20260712-150000.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "========================================"
echo "WARNING: Database restore operation"
echo "========================================"
echo ""
echo "This will OVERWRITE all data in the database with contents from:"
echo "$BACKUP_FILE"
echo ""
echo "Type 'yes' to confirm, anything else to cancel:"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

echo "Restoring database from $BACKUP_FILE..."
psql "$DATABASE_URL" < "$BACKUP_FILE"

echo "Database restore completed successfully"
