#!/bin/bash
# UniGo Platform — Automated Backup Script
# Run: crontab -e → 0 2 * * * /path/to/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/unigo"
S3_BUCKET="${S3_BACKUP_BUCKET:-s3://unigo-backups}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# 1. PostgreSQL backup
if [ -n "$DATABASE_URL" ]; then
  echo "  → PostgreSQL dump..."
  pg_dump "$DATABASE_URL" --no-password |     gzip > "$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
  echo "  ✅ PostgreSQL: $BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
fi

# 2. Redis backup
if redis-cli ping &>/dev/null; then
  echo "  → Redis snapshot..."
  redis-cli BGSAVE
  sleep 2
  cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
  echo "  ✅ Redis: $BACKUP_DIR/redis_${TIMESTAMP}.rdb"
fi

# 3. Upload to S3
if command -v aws &>/dev/null; then
  echo "  → Uploading to S3..."
  aws s3 sync "$BACKUP_DIR" "$S3_BUCKET/$(date +%Y/%m/%d)/"     --exclude "*" --include "*${TIMESTAMP}*"
  echo "  ✅ S3: $S3_BUCKET"
fi

# 4. Cleanup old local backups (keep 7 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.rdb"    -mtime +7 -delete

echo "[$(date)] Backup completed ✅"
