#!/usr/bin/env bash
# Выключить режим обслуживания.
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"
# shellcheck source=scripts/lib/maintenance-flag.sh
source "$(dirname "$0")/lib/maintenance-flag.sh"

rm -f /tmp/krimvk-maintenance "${APP_DIR}/.maintenance"
[[ -n "${MAINTENANCE_FLAG_FILE:-}" ]] && rm -f "$MAINTENANCE_FLAG_FILE" || true

# Флаг мог быть создан через sudo в каталоге приложения
if [[ -f "${APP_DIR}/.maintenance" ]]; then
  sudo rm -f "${APP_DIR}/.maintenance" 2>/dev/null || true
fi

ENV_FILE="${ENV_FILE:-.env}"
krimvk_set_maintenance_env 0 "$ENV_FILE"

# .env часто root:root после деплоя — сбросить MAINTENANCE_MODE через sudo
if [[ -f "$ENV_FILE" ]] && grep -q '^MAINTENANCE_MODE=1' "$ENV_FILE" 2>/dev/null; then
  if [[ ! -w "$ENV_FILE" ]]; then
    echo "Сбрасываем MAINTENANCE_MODE в .env через sudo..."
    sudo sed -i 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=0/' "$ENV_FILE" 2>/dev/null || true
  fi
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart krimvk --update-env
fi

if command -v nginx >/dev/null 2>&1; then
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
  fi
fi

echo ""
echo "Maintenance OFF."
if [[ -x "$(dirname "$0")/maintenance-status.sh" ]]; then
  "$(dirname "$0")/maintenance-status.sh"
else
  echo "Проверка: ls -la /tmp/krimvk-maintenance ${APP_DIR}/.maintenance; grep MAINTENANCE_MODE $ENV_FILE"
fi
