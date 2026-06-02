#!/usr/bin/env bash
# UFW: HTTP/HTTPS на origin только с подсетей Smart Web Security (обход SWS режется).
# SSH остаётся открыт (или только с ADMIN_IP — см. ниже).
#
# Запускать ПОСЛЕ стабильного SWS: DNS → 51.250.116.133, origin HTTPS Healthy.
#   sudo bash scripts/ufw-yandex-sws-origin.sh
#
# Подсети SWS: https://yandex.cloud/ru/docs/security/ip-list (раздел Smart Web Security)
# Certbot HTTP-01 с интернета на :80 не пройдёт — DNS-01 или временно открыть 80.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите: sudo bash $0"
  exit 1
fi

SSH_PORT="${SSH_PORT:-22}"
# Домашний/офисный IP для прямого HTTPS на VPS (опционально, иначе только SWS)
ADMIN_IP="${ADMIN_IP:-}"

# Официальные диапазоны SWS → origin (обновляйте по доке Yandex при сбоях)
SWS_IPV4=(
  "46.243.212.0/24"
  "194.247.51.0/24"
  "51.250.116.133/32"
)

log() { echo "[sws-ufw] $*"; }

apt-get install -y ufw

log "Сброс UFW (incoming deny)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

if [[ -n "$ADMIN_IP" ]]; then
  log "SSH и HTTPS только с ADMIN_IP=${ADMIN_IP}"
  ufw allow from "$ADMIN_IP" to any port "${SSH_PORT}" proto tcp comment 'SSH admin'
  ufw allow from "$ADMIN_IP" to any port 443 proto tcp comment 'HTTPS admin'
else
  log "SSH порт ${SSH_PORT} — для всех (задайте ADMIN_IP=... для ограничения)"
  ufw allow "${SSH_PORT}/tcp" comment 'SSH'
fi

log "HTTP/HTTPS только с подсетей SWS..."
for cidr in "${SWS_IPV4[@]}"; do
  ufw allow from "$cidr" to any port 80 proto tcp comment 'SWS HTTP'
  ufw allow from "$cidr" to any port 443 proto tcp comment 'SWS HTTPS'
done

ufw --force enable

cat <<EOF

=== Готово ===
  sudo ufw status numbered

Проверка (с Mac, не с VPS):
  dig @8.8.8.8 +short krimvk.ru A
  curl -fsSI https://krimvk.ru/api/health

Прямой https://89.111.165.160/ с интернета должен НЕ отвечать (таймаут/refused).

Перед включением UFW держите открытую SSH-сессию. При блокировке — консоль Yandex Cloud (serial).

Документация: docs/YANDEX_PROTECTION.md

EOF
