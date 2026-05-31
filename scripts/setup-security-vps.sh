#!/usr/bin/env bash
# Полная настройка безопасности на VPS (от root). После: смените пароль root.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запуск: sudo bash scripts/setup-security-vps.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

if [[ "$(stat -c '%U' "${REPO_ROOT}")" == "root" ]]; then
  git config --global --add safe.directory "${REPO_ROOT}" 2>/dev/null || true
fi
git pull origin main

export DEBIAN_FRONTEND=noninteractive
bash scripts/harden-vps.sh
bash scripts/apply-nginx-rate-limits.sh

mkdir -p /var/backups/krimvk logs
chown -R krimvk:krimvk /var/backups/krimvk "${REPO_ROOT}/logs" 2>/dev/null || true
chmod 600 /var/www/krimvk/.env 2>/dev/null || true

# cron только у krimvk
crontab -l 2>/dev/null | grep -v krimvk-daily-backup | crontab - 2>/dev/null || true
CRON_USER=krimvk bash scripts/setup-backup-cron.sh

echo ""
bash scripts/audit-vps.sh

cat <<'EOF'

=== Дальше вручную ===
1. passwd root  — новый пароль
2. /etc/ssh/sshd_config: PasswordAuthentication no, PermitRootLogin no, AllowUsers krimvk
3. systemctl reload sshd  (не закрывайте сессию, пока не проверите: ssh krimvk@...)
4. Cloudflare — docs/CLOUDFLARE.md

EOF
