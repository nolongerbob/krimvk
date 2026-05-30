#!/usr/bin/env bash
# Быстрая проверка мониторинга на VPS
set -euo pipefail

MON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../monitoring" && pwd)"
cd "${MON_DIR}"

echo "=== prometheus.yml на диске ==="
grep -E 'targets:|replacement:' prometheus/prometheus.yml | head -10

echo ""
echo "=== prometheus.yml в контейнере ==="
docker compose exec prometheus cat /etc/prometheus/prometheus.yml 2>/dev/null | grep -E 'targets:|replacement:' | head -10 || echo "(prometheus не в bridge — проверьте файл на диске)"

echo ""
echo "=== экспортеры на хосте ==="
curl -sf --max-time 3 http://127.0.0.1:9100/metrics >/dev/null && echo "node-exporter :9100 OK" || echo "node-exporter :9100 FAIL"
curl -sf --max-time 3 http://127.0.0.1:9187/metrics >/dev/null && echo "postgres-exporter :9187 OK" || echo "postgres-exporter :9187 FAIL"
curl -sf --max-time 3 http://127.0.0.1:9115/metrics >/dev/null && echo "blackbox :9115 OK" || echo "blackbox :9115 FAIL"
curl -sf --max-time 3 http://127.0.0.1:3000/api/health >/dev/null && echo "app :3000/health OK" || echo "app :3000/health FAIL"

echo ""
echo "=== Prometheus up (ожидаем 127.0.0.1 и value 1) ==="
curl -s 'http://127.0.0.1:9090/api/v1/query?query=up' | python3 -m json.tool 2>/dev/null || curl -s 'http://127.0.0.1:9090/api/v1/query?query=up'
