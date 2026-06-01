#!/usr/bin/env bash
# Поиск IP и не-https URL в .env (на VPS: cd /var/www/krimvk && ./scripts/audit-public-urls.sh)
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

echo "=== Audit public URLs (no IP leak) ==="

scan_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  echo ""
  echo "--- $f ---"
  grep -nE '^(SITE_URL|NEXTAUTH_URL|STORAGE_BASE_URL|S3_PUBLIC_URL_BASE|ONE_C_API_BASE_URL|CANONICAL_HOST)=' "$f" 2>/dev/null || echo "(no matching keys)"
  if grep -E '=.*[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' "$f" 2>/dev/null | grep -vE '127\.0\.0\.1|10\.|192\.168\.'; then
    echo "WARN: найден публичный IPv4 в значениях (см. выше)"
    return 1
  fi
  return 0
}

fail=0
scan_file "$ENV_FILE" || fail=1
[[ -f "$APP_DIR/.env.dev" ]] && scan_file "$APP_DIR/.env.dev" || true

echo ""
echo "PM2 NEXTAUTH_URL (runtime):"
pm2 env krimvk 2>/dev/null | grep -E '^NEXTAUTH_URL:' || echo "(pm2 env unavailable)"

echo ""
if [[ $fail -eq 0 ]]; then
  echo "OK: в .env нет явного публичного IP (кроме localhost/private)."
  echo "Проверьте вручную: curl -sS https://krimvk.ru/api/site-config"
else
  echo "Исправьте .env и: pm2 restart krimvk --update-env && npm run build"
  exit 1
fi
