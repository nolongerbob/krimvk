#!/usr/bin/env bash
# Скачивает популярные дашборды Grafana.com в provisioning (источник: Prometheus)
set -euo pipefail

OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../monitoring/grafana/provisioning/dashboards/json" && pwd)"
mkdir -p "${OUT_DIR}"

download() {
  local id="$1"
  local name="$2"
  local out="${OUT_DIR}/${name}.json"
  echo "→ ${name} (id ${id})"
  curl -fsSL "https://grafana.com/api/dashboards/${id}/revisions/latest/download" -o "${out}.tmp"
  # Подставить имя datasource Prometheus для auto-provisioning
  sed 's/\${DS_PROMETHEUS}/Prometheus/g; s/"datasource": *"[^"]*"/"datasource": "Prometheus"/g' "${out}.tmp" > "${out}" || mv "${out}.tmp" "${out}"
  rm -f "${out}.tmp"
}

download 1860 node-exporter-full
download 9628 postgresql-database
download 7587 blackbox-exporter

echo "Готово: ${OUT_DIR}"
echo "Перезапуск Grafana: cd monitoring && docker compose restart grafana"
