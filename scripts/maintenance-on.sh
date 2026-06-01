#!/usr/bin/env bash
# Включить страницу «Делаем сервис лучше» (nginx + Next.js).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"
# shellcheck source=scripts/lib/maintenance-flag.sh
source "$(dirname "$0")/lib/maintenance-flag.sh"

FLAG="$(krimvk_maintenance_flag_path "$APP_DIR")"
touch "$FLAG"

ENV_FILE="${ENV_FILE:-.env}"
krimvk_set_maintenance_env 1 "$ENV_FILE"

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart krimvk --update-env 2>/dev/null || true
fi

if command -v nginx >/dev/null 2>&1; then
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
  fi
fi

echo "Maintenance ON: visitors see public/maintenance.html"
echo "  nginx flag: $FLAG"
echo "  app env:    MAINTENANCE_MODE=1 in $ENV_FILE (if writable)"
if [[ "$FLAG" == /tmp/krimvk-maintenance ]]; then
  echo "  nginx:      add  if (-f /tmp/krimvk-maintenance) { rewrite ^ /maintenance.html break; }  in location /"
fi
