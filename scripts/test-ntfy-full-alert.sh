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

echo "→ POST ${URL}"
curl -fsS -X POST -H "X-Ops-Secret: ${OPS_TEST_SECRET}" "${URL}"
echo ""
echo "OK — в ntfy должно прийти сообщение со stack trace."
