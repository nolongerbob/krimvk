#!/usr/bin/env bash
# Включить страницу «Делаем сервис лучше» (nginx + Next.js).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

touch .maintenance

ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^MAINTENANCE_MODE=' "$ENV_FILE"; then
    sed -i 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=1/' "$ENV_FILE"
  else
    echo 'MAINTENANCE_MODE=1' >> "$ENV_FILE"
  fi
else
  echo "WARN: $ENV_FILE not found — set MAINTENANCE_MODE=1 manually" >&2
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart krimvk --update-env 2>/dev/null || true
fi

if command -v nginx >/dev/null 2>&1; then
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
  fi
fi

echo "Maintenance ON: visitors see public/maintenance.html"
echo "  nginx flag: $APP_DIR/.maintenance"
echo "  app env:    MAINTENANCE_MODE=1 in $ENV_FILE"
