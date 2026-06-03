#!/usr/bin/env bash
# Smoke для dev/staging (не трогает prod). BASE_URL=http://127.0.0.1:3001 ./scripts/smoke-local.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"

echo "Smoke: ${BASE_URL}"

code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health")
test "${code}" = "200" && echo "OK health ${code}" || { echo "FAIL health ${code}"; exit 1; }

code=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/address/suggest" \
  -H 'Content-Type: application/json' -d '{"query":"симф"}')
test "${code}" = "401" && echo "OK dadata anon ${code}" || { echo "FAIL dadata expected 401 got ${code}"; exit 1; }

code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/files/applications/test")
test "${code}" = "403" && echo "OK public files block ${code}" || { echo "FAIL files/applications expected 403 got ${code}"; exit 1; }

echo "Smoke passed."
