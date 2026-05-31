#!/usr/bin/env bash
# Установка cron для ежедневного бэкапа (пользователь krimvk)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"
CRON_LINE="${CRON_SCHEDULE} ${REPO_ROOT}/scripts/backup-run-daily.sh >> ${REPO_ROOT}/logs/backup.log 2>&1"
MARKER="# krimvk-daily-backup"
CRON_USER="${CRON_USER:-krimvk}"

chmod +x "${REPO_ROOT}/scripts/backup-run-daily.sh"
chmod +x "${REPO_ROOT}/scripts/backup-db.sh"
chmod +x "${REPO_ROOT}/scripts/backup-uploads.sh"
chmod +x "${REPO_ROOT}/scripts/backup-push-s3.sh" 2>/dev/null || true
chmod +x "${REPO_ROOT}/scripts/restore-db.sh"

if [[ "$(id -u)" -eq 0 ]]; then
  mkdir -p /var/backups/krimvk "${REPO_ROOT}/logs"
  chown -R "${CRON_USER}:${CRON_USER}" /var/backups/krimvk "${REPO_ROOT}/logs"
  CRON_TARGET=(crontab -u "${CRON_USER}")
else
  sudo mkdir -p /var/backups/krimvk
  sudo chown "$(whoami):$(whoami)" /var/backups/krimvk 2>/dev/null || true
  CRON_TARGET=(crontab)
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Установите клиент PostgreSQL: sudo apt install -y postgresql-client"
  exit 1
fi

( "${CRON_TARGET[@]}" -l 2>/dev/null | grep -v "${MARKER}" || true
  echo "${CRON_LINE} ${MARKER}"
) | "${CRON_TARGET[@]}" -

echo "Cron установлен (${CRON_USER}):"
"${CRON_TARGET[@]}" -l | grep krimvk-daily-backup || true
echo ""
echo "Проверка вручную: ${REPO_ROOT}/scripts/backup-run-daily.sh"
echo "Лог: ${REPO_ROOT}/logs/backup.log"
