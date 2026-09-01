# Database Backup & Restore (mysqldump)

All commands run on the server. Replace credentials/paths as needed.

## Backup

One-off backup:

```bash
mysqldump -u shortlink_user -p shortlink \
  --single-transaction --routines --triggers \
  > /var/backups/shortlink/shortlink-$(date +%F-%H%M).sql
```

`--single-transaction` gives a consistent snapshot without locking writes (InnoDB).

## Scheduled backup (cron) with retention

Create `/usr/local/bin/shortlink-backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DB_USER="shortlink_user"
DB_NAME="shortlink"
BACKUP_DIR="/var/backups/shortlink"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# password from a root-only file, never in the script
source /etc/shortlink-backup.env   # export DB_PASS="..."

FILE="$BACKUP_DIR/shortlink-$(date +%F-%H%M).sql.gz"

mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --single-transaction --routines --triggers | gzip > "$FILE"

# retention: keep N days of daily backups + first-of-month forever
find "$BACKUP_DIR" -name "shortlink-*.sql.gz" -mtime +"$RETENTION_DAYS" \
  ! -name "shortlink-*-01-*" -delete

echo "backup ok: $FILE"
```

Make it executable and install the cron:

```bash
chmod +x /usr/local/bin/shortlink-backup.sh
chmod 600 /etc/shortlink-backup.env

# run daily at 02:30
(crontab -l 2>/dev/null; echo "30 2 * * * /usr/local/bin/shortlink-backup.sh >> /var/log/shortlink-backup.log 2>&1") | crontab -
crontab -l
```

Retention policy implemented above:
- daily backups kept 14 days
- the first backup of every month is kept forever (matches `*-01-*`)

## Restore

```bash
# restore the latest backup into a fresh database
gunzip -c /var/backups/shortlink/shortlink-2026-09-01-0230.sql.gz | \
  mysql -u shortlink_user -p shortlink
```

If restoring to a NEW server, create the database first (see `docs/DEPLOYMENT.md` §5),
then apply the dump. After restore, verify:

```bash
mysql -u shortlink_user -p shortlink -e "SELECT COUNT(*) FROM links; SELECT COUNT(*) FROM clicks;"
```

## Test the restore regularly

A backup that is never restored is not a backup. At least monthly:

```bash
mysql -u shortlink_user -p -e "CREATE DATABASE shortlink_restore_test;"
gunzip -c <(ls -t /var/backups/shortlink/*.sql.gz | head -1) | mysql -u shortlink_user -p shortlink_restore_test
mysql -u shortlink_user -p shortlink_restore_test -e "SELECT COUNT(*) FROM links;"
mysql -u shortlink_user -p -e "DROP DATABASE shortlink_restore_test;"
```

## Off-site copy (optional but recommended)

`rsync` the backup dir to another host, or ship it to object storage:

```bash
rsync -avz /var/backups/shortlink/ backup@offsite-host:/backups/shortlink/
```
