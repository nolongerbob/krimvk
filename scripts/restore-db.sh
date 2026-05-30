#!/usr/bin/env bash

set -Eeuo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: DATABASE_URL=... $0 /path/to/db_backup.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring DB from: ${BACKUP_FILE}"
gzip -dc "${BACKUP_FILE}" | psql "${DATABASE_URL}"
echo "Restore completed"
