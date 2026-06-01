#!/usr/bin/env bash
# Показать, что держит сайт в режиме обслуживания.
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

echo "=== Maintenance status ==="
echo "App dir: $APP_DIR"
echo ""

for f in /tmp/krimvk-maintenance "$APP_DIR/.maintenance"; do
  if [[ -f "$f" ]]; then
    echo "FLAG ON:  $f"
  else
    echo "flag off: $f"
  fi
done

if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^MAINTENANCE_MODE=' "$ENV_FILE" 2>/dev/null; then
    echo "ENV:      $(grep '^MAINTENANCE_MODE=' "$ENV_FILE")"
  else
    echo "ENV:      MAINTENANCE_MODE not set (OK)"
  fi
else
  echo "ENV:      $ENV_FILE not found"
fi

echo ""
echo "HTTP check (local nginx → app):"
if curl -sS -o /dev/null -w "  /api/health → %{http_code}\n" --max-time 5 http://127.0.0.1:3000/api/health 2>/dev/null; then
  true
else
  echo "  /api/health → (curl failed — is PM2 running?)"
fi

if curl -sS -o /dev/null -w "  https site /api/health → %{http_code}\n" --max-time 5 https://krimvk.ru/api/health 2>/dev/null; then
  true
else
  echo "  https site → (curl failed)"
fi
