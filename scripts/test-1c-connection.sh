#!/usr/bin/env bash
# Проверка доступности 1С с VPS (без вывода пароля в лог).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source <(grep -E '^ONE_C_API_BASE_URL=' "$ENV_FILE" | sed 's/\r$//')
  set +a
fi

BASE="${ONE_C_API_BASE_URL:-}"
REGION="${1:-prog}"
LS="${2:-}"
PASS="${3:-}"

if [[ -z "$BASE" ]]; then
  echo "ERROR: ONE_C_API_BASE_URL не задан в $ENV_FILE"
  exit 1
fi

BASE="${BASE%/}"
echo "=== 1C connectivity test ==="
echo "BASE_URL=$BASE"
echo "REGION=$REGION"
echo ""

echo "1) Пинг 1С без логина/пароля (ожидаем 404 + Error in incoming data — это норма):"
code=$(curl -sS -o /tmp/1c-test-body.txt -w '%{http_code}' --connect-timeout 15 \
  "${BASE}/${REGION}/hs/WebAccounts/get_data" 2>/tmp/1c-test-curl.err || echo "000")
if [[ -f /tmp/1c-test-curl.err ]] && [[ -s /tmp/1c-test-curl.err ]]; then
  echo "   curl error: $(head -1 /tmp/1c-test-curl.err)"
fi
echo "   HTTP $code"
head -c 200 /tmp/1c-test-body.txt 2>/dev/null; echo ""
if [[ "$code" == "404" ]]; then
  echo "   OK: 1С отвечает (404 без учётных данных — штатно)."
fi

if [[ -n "$LS" && -n "$PASS" ]]; then
  echo ""
  echo "2) С учётными данными (первые 200 символов ответа):"
  url="${BASE}/${REGION}/hs/WebAccounts/get_data"
  code=$(curl -sS -o /tmp/1c-test-auth.txt -w '%{http_code}' --connect-timeout 30 -G "$url" \
    --data-urlencode "WaLsCode=$LS" \
    --data-urlencode "WaPass=$PASS")
  echo "   HTTP $code"
  head -c 200 /tmp/1c-test-auth.txt; echo ""
fi

echo ""
if [[ "$code" == "000" ]]; then
  echo "FAIL: нет связи с 1С. Откройте доступ с IP VPS $(curl -sS ifconfig.me 2>/dev/null || echo '?') на стороне 1С/firewall."
  exit 1
fi
if [[ -n "$LS" && -n "$PASS" ]] && [[ "${code:-}" != "200" ]]; then
  echo "WARN: с учётными данными HTTP ${code:-?} — проверьте л/с, пароль 1С, region (часто prog)."
  exit 1
fi
echo "Готово. На сайте: pm2 restart krimvk --update-env после правок .env"
