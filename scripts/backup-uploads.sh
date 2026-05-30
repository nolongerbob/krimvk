#!/usr/bin/env bash

set -Eeuo pipefail

UPLOADS_DIR="${UPLOADS_DIR:-/var/www/krimvk/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/krimvk}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

if [[ ! -d "${UPLOADS_DIR}" ]]; then
  echo "Uploads directory not found: ${UPLOADS_DIR}"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

echo "Creating uploads backup: ${OUT_FILE}"
tar -czf "${OUT_FILE}" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"

echo "Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name "uploads_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "Done"
