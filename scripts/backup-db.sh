#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-.}/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup-literary_studio-$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting backup to $BACKUP_FILE..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_FILE (size: $FILE_SIZE)"

# Cleanup old backups
echo "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup-literary_studio-*.sql" -mtime +$RETENTION_DAYS -delete

echo "Backup operation completed successfully"
