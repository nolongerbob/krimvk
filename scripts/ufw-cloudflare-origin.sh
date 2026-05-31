#!/usr/bin/env bash
# UFW: HTTP/HTTPS только с IP Cloudflare (origin protection).
# SSH (22) остаётся открыт — иначе потеряете доступ.
#
# Запускать ПОСЛЕ того, как сайт уже работает через Cloudflare (оранжевое облако).
# sudo bash scripts/ufw-cloudflare-origin.sh
#
# Certbot: HTTP-01 с Let's Encrypt с интернета не пройдёт — см. docs/CLOUDFLARE.md
# (Origin Certificate от Cloudflare или DNS-01).
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите: sudo bash $0"
  exit 1
fi

SSH_PORT="${SSH_PORT:-22}"
CF_IPV4_URL="https://www.cloudflare.com/ips-v4"
CF_IPV6_URL="https://www.cloudflare.com/ips-v6"

log() { echo "[cf-ufw] $*"; }

apt-get install -y ufw curl

log "Сброс правил UFW (incoming deny, outgoing allow)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

log "SSH порт ${SSH_PORT} — для всех (Cloudflare SSH не проксирует)"
ufw allow "${SSH_PORT}/tcp" comment 'SSH'

log "Загрузка списков Cloudflare..."
mapfile -t IPV4 < <(curl -fsSL "$CF_IPV4_URL")
mapfile -t IPV6 < <(curl -fsSL "$CF_IPV6_URL")

for cidr in "${IPV4[@]}"; do
  [[ -z "$cidr" ]] && continue
  ufw allow from "$cidr" to any port 80 proto tcp comment 'CF HTTP'
  ufw allow from "$cidr" to any port 443 proto tcp comment 'CF HTTPS'
done

for cidr in "${IPV6[@]}"; do
  [[ -z "$cidr" ]] && continue
  ufw allow from "$cidr" to any port 80 proto tcp comment 'CF HTTP v6'
  ufw allow from "$cidr" to any port 443 proto tcp comment 'CF HTTPS v6'
done

ufw --force enable

cat <<EOF

=== Готово ===
  ufw status numbered

Проверка с вашего ПК (не с VPS):
  curl -fsSI https://krimvk.ru/api/health

Прямой заход на http://89.111.165.160/ с браузера должен НЕ работать (это нормально).

Документация: docs/CLOUDFLARE.md

EOF
