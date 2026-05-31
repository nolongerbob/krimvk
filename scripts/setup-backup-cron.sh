#!/usr/bin/env bash
# Установка cron для ежедневного бэкапа (пользователь krimvk)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"
CRON_LINE="${CRON_SCHEDULE} ${REPO_ROOT}/scripts/backup-run-daily.sh >> ${REPO_ROOT}/logs/backup.log 2>&1"
MARKER="# krimvk-daily-backup"

chmod +x "${REPO_ROOT}/scripts/backup-run-daily.sh"
chmod +x "${REPO_ROOT}/scripts/backup-db.sh"
chmod +x "${REPO_ROOT}/scripts/backup-uploads.sh"
chmod +x "${REPO_ROOT}/scripts/backup-push-s3.sh" 2>/dev/null || true
chmod +x "${REPO_ROOT}/scripts/restore-db.sh"

sudo mkdir -p /var/backups/krimvk
sudo chown "$(whoami):$(whoami)" /var/backups/krimvk 2>/dev/null || true

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Установите клиент PostgreSQL: sudo apt install -y postgresql-client"
  exit 1
fi

( crontab -l 2>/dev/null | grep -v "${MARKER}" || true
  echo "${CRON_LINE} ${MARKER}"
) | crontab -

echo "Cron установлен:"
crontab -l | grep krimvk-daily-backup || true
echo ""
echo "Проверка вручную: ${REPO_ROOT}/scripts/backup-run-daily.sh"
echo "Лог: ${REPO_ROOT}/logs/backup.log"
