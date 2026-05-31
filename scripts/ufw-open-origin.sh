#!/usr/bin/env bash
# Открыть 80/443 для всех (прямой доступ на VPS без Cloudflare proxy).
# Нужно, если в РФ без VPN не открывается сайт через Cloudflare.
# В Cloudflare: A @ и www → серое облако (DNS only) → 89.111.165.160
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo bash scripts/ufw-open-origin.sh"
  exit 1
fi

SSH_PORT="${SSH_PORT:-22}"

apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp comment 'HTTP direct'
ufw allow 443/tcp comment 'HTTPS direct'
ufw --force enable

cat <<'EOF'

=== UFW: прямой доступ 80/443 ===

1. Cloudflare → DNS → A @ и www → **серое облако** (DNS only), IP 89.111.165.160
2. Подождать 5–30 мин (TTL DNS)
3. Проверка с телефона без VPN: https://krimvk.ru

Certbot по HTTP-01 снова может работать (порт 80 открыт).

EOF
ufw status verbose
