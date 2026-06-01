#!/usr/bin/env bash
# Проверка NEXTAUTH_URL / SITE_URL на VPS
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

echo "=== Site URL env check ==="
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

grep -E '^(SITE_URL|NEXTAUTH_URL|STORAGE_BASE_URL|S3_PUBLIC_URL_BASE|CANONICAL_HOST)=' "$ENV_FILE" || true
echo ""

NEXT=$(grep '^NEXTAUTH_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
SITE=$(grep '^SITE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)

fail=0
if [[ "$NEXT" =~ ^https?://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "WARN: NEXTAUTH_URL — IP ($NEXT). Для production задайте:"
  echo "  SITE_URL=https://krimvk.ru"
  echo "  NEXTAUTH_URL=https://krimvk.ru"
  fail=1
fi
if [[ -n "$SITE" && "$SITE" =~ ^https?://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "WARN: SITE_URL — IP ($SITE)"
  fail=1
fi
if [[ "$NEXT" != https://* ]] && [[ "$NEXT" != http://localhost* ]]; then
  echo "WARN: NEXTAUTH_URL без https: $NEXT"
  fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "OK"
else
  echo ""
  echo "После правки: pm2 restart krimvk --update-env"
  exit 1
fi
