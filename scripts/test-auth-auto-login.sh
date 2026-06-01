#!/usr/bin/env bash
# Проверка безопасности auto-login на уже задеплоенном сайте (read-only, без реальных userId).
set -euo pipefail

BASE_URL="${BASE_URL:-https://krimvk.ru}"

echo "=== Auto-login security smoke test ==="
echo "BASE_URL=$BASE_URL"
echo ""

# 1) Старый API с userId должен отклоняться
code=$(curl -sS -o /tmp/auto-login-body.json -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/auto-login" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"00000000-0000-0000-0000-000000000001"}')
echo "POST userId only → HTTP $code (ожидаем 400 после деплоя b2ed077+)"
cat /tmp/auto-login-body.json
echo ""
if [[ "$code" == "404" ]] && grep -q 'Пользователь не найден' /tmp/auto-login-body.json 2>/dev/null; then
  echo "WARN: на сервере ещё СТАРЫЙ auto-login (принимает userId). Сделайте: git pull && ./scripts/deploy-vps.sh"
  echo "      Затем запустите этот скрипт снова."
  exit 2
fi
if [[ "$code" != "400" ]]; then
  echo "FAIL: ожидался 400 для userId (новая версия)"
  exit 1
fi

# 2) Пустой body
code=$(curl -sS -o /tmp/auto-login-body.json -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/auto-login" \
  -H 'Content-Type: application/json' \
  -d '{}')
echo "POST empty → HTTP $code (ожидаем 400)"
cat /tmp/auto-login-body.json
echo ""
if [[ "$code" != "400" ]]; then
  echo "FAIL: ожидался 400 для пустого body"
  exit 1
fi

# 3) Поддельный loginToken
code=$(curl -sS -o /tmp/auto-login-body.json -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/auto-login" \
  -H 'Content-Type: application/json' \
  -d '{"loginToken":"fake.invalid.token"}')
echo "POST fake loginToken → HTTP $code (ожидаем 401)"
cat /tmp/auto-login-body.json
echo ""
if [[ "$code" != "401" ]]; then
  echo "FAIL: ожидался 401 для поддельного токена"
  exit 1
fi

# 4) check-email-verified не должен принимать userId в query
code=$(curl -sS -o /tmp/check-body.json -w '%{http_code}' \
  "$BASE_URL/api/auth/check-email-verified?userId=00000000-0000-0000-0000-000000000001")
echo "GET check-email-verified?userId=... → HTTP $code"
cat /tmp/check-body.json
echo ""
body=$(cat /tmp/check-body.json)
if echo "$body" | grep -q '"loginToken"'; then
  echo "FAIL: loginToken не должен выдаваться по userId в query"
  exit 1
fi
if echo "$body" | grep -q '"userId"'; then
  echo "FAIL: userId не должен возвращаться в ответе"
  exit 1
fi

echo "OK: все проверки пройдены."
