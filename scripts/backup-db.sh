#!/usr/bin/env bash

set -Eeuo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/krimvk}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Creating DB backup: ${OUT_FILE}"
if ! pg_dump "${DATABASE_URL}" | gzip > "${OUT_FILE}"; then
  rm -f "${OUT_FILE}"
  echo "pg_dump failed"
  exit 1
fi

if [[ ! -s "${OUT_FILE}" ]]; then
  rm -f "${OUT_FILE}"
  echo "Backup file is empty"
  exit 1
fi

echo "Backup size: $(du -h "${OUT_FILE}" | cut -f1)"

echo "Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name "db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "Done"
