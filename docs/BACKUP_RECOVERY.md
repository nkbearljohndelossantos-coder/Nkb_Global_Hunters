# NKB GLOBAL HUNTER — BACKUP & DISASTER RECOVERY PROCEDURES

## 1. Automated PostgreSQL Backup Strategy

On the Hostinger AlmaLinux VPS, configure automated daily dumps of the `nkb_global_hunter_staging` / production database using cron.

### Backup Script (`/usr/local/bin/backup_nkb_hunter.sh`):

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/nkb_hunter"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="nkb_global_hunter_staging"
DB_USER="nkb_hunter_staging"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Execute compressed pg_dump
pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
chmod 600 "${BACKUP_FILE}"

# Retain backups for 30 days
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: ${BACKUP_FILE}"
```

Make executable and schedule in crontab:
```bash
chmod +x /usr/local/bin/backup_nkb_hunter.sh
# Run every day at 02:00 AM
crontab -e
0 2 * * * /usr/local/bin/backup_nkb_hunter.sh >> /var/log/nkb_hunter_backup.log 2>&1
```

---

## 2. Restoration & Recovery Procedure

To restore a database dump:

```bash
# 1. Stop the application service to prevent active writes
pm2 stop nkb-hunter-staging-api

# 2. Decompress and restore into PostgreSQL
gunzip -c /var/backups/nkb_hunter/nkb_global_hunter_staging_YYYYMMDD_HHMMSS.sql.gz | psql -U nkb_hunter_staging -d nkb_global_hunter_staging

# 3. Restart application
pm2 start nkb-hunter-staging-api
```

---

## 3. Migration Rollback Strategy

Every schema alteration in `server/src/db/migrations/` is versioned chronologically (`001_initial_schema.sql`, `002_...`). Before applying any forward schema migration:
1. Run the backup script above.
2. If a migration fails, the transaction is rolled back automatically.
3. If manual rollback is required, restore the pre-migration snapshot.
