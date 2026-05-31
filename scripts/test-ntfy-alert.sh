#!/usr/bin/env bash
# Проверка push в ntfy (тот же канал, что и алерты с VPS)
set -euo pipefail

ENV_FILE="${1:-/var/www/krimvk/.env}"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -z "${NTFY_TOPIC:-}" ]]; then
  echo "Ошибка: NTFY_TOPIC не задан в ${ENV_FILE}"
  exit 1
fi

BASE="${NTFY_SERVER:-https://ntfy.sh}"
BASE="${BASE%/}"
URL="${BASE}/${NTFY_TOPIC}"

echo "→ POST ${URL}"
curl -fsS -d "KrimVK: тест алерта $(date '+%Y-%m-%d %H:%M:%S')" \
  -H "Title: KrimVK test" \
  -H "Priority: high" \
  "${URL}"
echo ""
echo "OK — проверьте приложение ntfy на телефоне."
echo ""
echo "Это только проверка канала. Полный stack: ./scripts/test-ntfy-full-alert.sh (см. docs/MOBILE_MONITORING.md)."
