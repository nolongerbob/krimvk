#!/usr/bin/env bash
# Выключить режим обслуживания.
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"
# shellcheck source=scripts/lib/maintenance-flag.sh
source "$(dirname "$0")/lib/maintenance-flag.sh"

rm -f "${APP_DIR}/.maintenance" /tmp/krimvk-maintenance
[[ -n "${MAINTENANCE_FLAG_FILE:-}" ]] && rm -f "$MAINTENANCE_FLAG_FILE" || true

ENV_FILE="${ENV_FILE:-.env}"
krimvk_set_maintenance_env 0 "$ENV_FILE"

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart krimvk --update-env 2>/dev/null || true
fi

if command -v nginx >/dev/null 2>&1; then
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
  fi
fi

echo "Maintenance OFF — site is live again."
