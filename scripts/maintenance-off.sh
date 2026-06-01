#!/usr/bin/env bash
# Выключить режим обслуживания.
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

rm -f .maintenance

ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]] && grep -q '^MAINTENANCE_MODE=' "$ENV_FILE"; then
  sed -i 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=0/' "$ENV_FILE"
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart krimvk --update-env 2>/dev/null || true
fi

if command -v nginx >/dev/null 2>&1; then
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
  fi
fi

echo "Maintenance OFF — site is live again."
