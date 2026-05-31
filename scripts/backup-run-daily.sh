#!/usr/bin/env bash
# Ежедневный бэкап: БД (+ uploads если локально). Вызывается из cron.
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
LOG_TAG="[backup $(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "${LOG_TAG} $*"; }

if [[ ! -f "${ENV_FILE}" ]]; then
  log "ERROR: не найден ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

export BACKUP_DIR="${BACKUP_DIR:-/var/backups/krimvk}"
export RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}" "${REPO_ROOT}/logs"

log "Старт"
"${REPO_ROOT}/scripts/backup-db.sh"
LATEST_DB="$(ls -t "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null | head -1 || true)"

if [[ "${BACKUP_S3_ENABLED:-0}" == "1" ]]; then
  if [[ -n "${LATEST_DB}" ]]; then
    log "Off-site: загрузка в S3"
    "${REPO_ROOT}/scripts/backup-push-s3.sh" "${LATEST_DB}" || log "WARN: S3 upload failed"
  fi
fi

STORAGE="${STORAGE_PROVIDER:-local}"
UPLOADS="${UPLOADS_DIR:-${REPO_ROOT}/uploads}"

if [[ "${STORAGE}" == "s3" ]]; then
  log "uploads на S3 — локальный tar пропущен (бэкап бакета отдельно в Yandex Cloud)"
elif [[ -d "${UPLOADS}" ]]; then
  UPLOADS_DIR="${UPLOADS}" "${REPO_ROOT}/scripts/backup-uploads.sh"
else
  log "uploads не найдены — пропуск"
fi

log "Готово. Файлы в ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}" | tail -5
