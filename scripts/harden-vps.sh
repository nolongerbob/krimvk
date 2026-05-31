#!/usr/bin/env bash
# Базовое hardening VPS: UFW, fail2ban, автообновления безопасности
# Запуск: sudo bash scripts/harden-vps.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите от root: sudo bash scripts/harden-vps.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_PORT="${SSH_PORT:-22}"

log() { echo "[harden] $*"; }

log "UFW..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

log "fail2ban..."
apt-get install -y fail2ban
if [[ -f "${REPO_ROOT}/monitoring/fail2ban/jail.local.example" ]]; then
  cp "${REPO_ROOT}/monitoring/fail2ban/jail.local.example" /etc/fail2ban/jail.local
  if [[ "${SSH_PORT}" != "22" ]]; then
    sed -i "s/port = ssh/port = ${SSH_PORT}/" /etc/fail2ban/jail.local
  fi
fi
systemctl enable fail2ban
systemctl restart fail2ban

log "unattended-upgrades..."
export DEBIAN_FRONTEND=noninteractive
apt-get install -y unattended-upgrades apt-listchanges
echo unattended-upgrades unattended-upgrades/enable_auto_updates boolean true | debconf-set-selections
dpkg-reconfigure -f noninteractive unattended-upgrades || true

log "nginx security snippet..."
if [[ -f "${REPO_ROOT}/nginx/krimvk-security.conf" ]]; then
  cp "${REPO_ROOT}/nginx/krimvk-security.conf" /etc/nginx/conf.d/krimvk-security.conf
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "nginx: krimvk-security.conf подключён"
  else
    log "ВНИМАНИЕ: nginx -t не прошёл — проверьте конфиг вручную"
  fi
fi

log "Права на .env (если есть)..."
for f in /var/www/krimvk/.env /var/www/krimvk/monitoring/.env; do
  if [[ -f "$f" ]]; then
    chown krimvk:krimvk "$f" 2>/dev/null || true
    chmod 600 "$f"
  fi
done

cat <<EOF

=== Hardening применён ===

Проверьте:
  ufw status
  fail2ban-client status
  fail2ban-client status sshd

SSH (рекомендуется вручную в /etc/ssh/sshd_config):
  PasswordAuthentication no
  PermitRootLogin no
  AllowUsers krimvk

После правок SSH: systemctl reload sshd

Документация: docs/WEB_SECURITY.md

EOF
