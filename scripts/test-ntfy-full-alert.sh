#!/usr/bin/env bash
# Полный тест алерта (stack) через /api/ops/test-alert
set -euo pipefail

ENV_FILE="${1:-/var/www/krimvk/.env}"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -z "${OPS_TEST_SECRET:-}" ]]; then
  echo "Добавьте в .env: OPS_TEST_SECRET=\$(openssl rand -hex 16)"
  exit 1
fi

BASE="${NEXTAUTH_URL:-https://krimvk.ru}"
BASE="${BASE%/}"
URL="${BASE}/api/ops/test-alert"

if command -v pm2 >/dev/null 2>&1; then
  if ! pm2 env krimvk 2>/dev/null | grep -q '^OPS_TEST_SECRET='; then
    echo "ВНИМАНИЕ: OPS_TEST_SECRET есть в .env, но не в процессе PM2."
    echo "  pm2 restart krimvk --update-env && pm2 save"
    echo ""
  fi
fi

echo "→ POST ${URL}"
HTTP_CODE="$(curl -sS -o /tmp/krimvk-ops-test-alert.json -w "%{http_code}" -X POST \
  -H "X-Ops-Secret: ${OPS_TEST_SECRET}" "${URL}")"

if [[ "${HTTP_CODE}" == "403" ]]; then
  echo "403 forbidden — секрет не совпадает или PM2 не перечитал .env."
  echo "  pm2 restart krimvk --update-env && pm2 save"
  echo "  pm2 env krimvk | grep OPS_TEST"
  cat /tmp/krimvk-ops-test-alert.json 2>/dev/null || true
  exit 1
fi

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "HTTP ${HTTP_CODE}"
  cat /tmp/krimvk-ops-test-alert.json 2>/dev/null || true
  exit 1
fi

cat /tmp/krimvk-ops-test-alert.json
echo ""
echo "OK — в ntfy должно прийти сообщение со stack trace."
