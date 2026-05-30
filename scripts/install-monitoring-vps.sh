#!/usr/bin/env bash
# Установка Prometheus + Grafana на VPS (только localhost, доступ через SSH-туннель)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MON_DIR="${REPO_ROOT}/monitoring"

if [[ ! -f "${MON_DIR}/docker-compose.yml" ]]; then
  echo "Не найден ${MON_DIR}/docker-compose.yml"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker не установлен. Установите: apt install -y docker.io docker-compose-v2"
  exit 1
fi

MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
if [[ "${MEM_MB}" -gt 0 && "${MEM_MB}" -lt 3500 ]]; then
  echo "Внимание: RAM ~${MEM_MB} MB. На 2 GB используйте только profile core:"
  echo "  docker compose --profile core up -d"
  echo "Профиль logs (Loki) не включайте без апгрейда RAM."
fi

cd "${MON_DIR}"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Создан monitoring/.env — задайте GRAFANA_ADMIN_PASSWORD и POSTGRES_EXPORTER_DSN"
  exit 1
fi

docker compose --profile core pull
docker compose --profile core up -d

if command -v curl >/dev/null 2>&1; then
  bash "${REPO_ROOT}/scripts/download-grafana-dashboards.sh" || echo "Предупреждение: дашборды не скачались (сеть?) — Import вручную: 1860, 9628, 7587"
  docker compose restart grafana 2>/dev/null || true
fi

echo ""
echo "Grafana:  http://127.0.0.1:3030  (с VPS: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3030/login)"
echo "С Mac:    ssh -L 3030:127.0.0.1:3030 krimvk@YOUR_VPS_IP"
echo "          затем откройте http://localhost:3030"
echo ""
echo "Импорт готовых дашбордов в Grafana → Dashboards → Import:"
echo "  Node Exporter Full: 1860"
echo "  PostgreSQL:         9628"
echo "  Blackbox:           7587"
