#!/usr/bin/env bash
# Увеличивает лимит загрузки файлов в nginx (качество воды до 200MB в API).
# Запуск на VPS: sudo bash scripts/patch-nginx-upload-limit.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo bash scripts/patch-nginx-upload-limit.sh"
  exit 1
fi

SITE="/etc/nginx/sites-available/krimvk"
if [[ ! -f "${SITE}" ]]; then
  echo "Not found: ${SITE}"
  exit 1
fi

cp -a "${SITE}" "${SITE}.bak.$(date +%Y%m%d%H%M%S)"
sed -i 's/client_max_body_size 50M/client_max_body_size 200M/g' "${SITE}"

nginx -t
systemctl reload nginx
echo "nginx upload limit set to 200M in ${SITE}"
