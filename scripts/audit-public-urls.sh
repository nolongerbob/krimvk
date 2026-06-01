#!/usr/bin/env bash
# Проверка: в ПУБЛИЧНЫХ URL (.env) нет IP VPS — письма, выход, редиректы.
# ONE_C_API_BASE_URL и DATABASE_URL могут быть IP (только сервер, не браузер).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

PUBLIC_KEYS='^(SITE_URL|NEXTAUTH_URL|STORAGE_BASE_URL|S3_PUBLIC_URL_BASE|CANONICAL_HOST)='
INFO_KEYS='^(ONE_C_API_BASE_URL|DATABASE_URL)='

echo "=== Audit public URLs (no IP leak to users) ==="

scan_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  echo ""
  echo "--- $f ---"
  echo "Публичные (не должны содержать IP VPS):"
  grep -nE "$PUBLIC_KEYS" "$f" 2>/dev/null || echo "  (нет ключей)"
  echo "Серверные (IP допустим, в браузер не попадают):"
  grep -nE "$INFO_KEYS" "$f" 2>/dev/null | sed 's/^/  /' || echo "  (нет)"

  local bad=0
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local val="${line#*=}"
    val="${val#\"}"
    val="${val%\"}"
    val="${val#\'}"
    val="${val%\'}"
    if echo "$val" | grep -qE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'; then
      if echo "$val" | grep -qvE '127\.0\.0\.1|10\.|192\.168\.'; then
        echo "WARN: IP в публичной переменной: $line"
        bad=1
      fi
    fi
  done < <(grep -E "$PUBLIC_KEYS" "$f" 2>/dev/null || true)

  return "$bad"
}

fail=0
scan_file "$ENV_FILE" || fail=1
[[ -f "$APP_DIR/.env.dev" ]] && scan_file "$APP_DIR/.env.dev" || true

echo ""
echo "PM2 env (если доступно):"
pm2 describe krimvk 2>/dev/null | grep -E 'NEXTAUTH_URL|SITE_URL' || echo "(запустите: pm2 describe krimvk | grep URL)"

echo ""
if [[ $fail -eq 0 ]]; then
  echo "OK: SITE_URL / NEXTAUTH_URL / S3_PUBLIC_* без IP."
  echo "ONE_C_API_BASE_URL с IP — нормально (только бэкенд → 1С)."
  echo "Проверка сайта: curl -sS https://krimvk.ru/api/site-config"
else
  echo "Исправьте публичные URL в .env → https://krimvk.ru, затем: npm run build && pm2 restart krimvk --update-env"
  exit 1
fi
