#!/usr/bin/env bash

set -Eeuo pipefail

APP_USER="${APP_USER:-krimvk}"
APP_DIR="${APP_DIR:-/var/www/krimvk}"
NODE_MAJOR="${NODE_MAJOR:-20}"
SSH_PORT="${SSH_PORT:-22}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/bootstrap-vps.sh"
  exit 1
fi

log "Updating apt index"
apt update -y

log "Installing base packages"
apt install -y curl ca-certificates gnupg ufw fail2ban nginx git jq

if ! command -v node >/dev/null 2>&1; then
  log "Installing Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing PM2"
  npm install -g pm2
fi

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  log "Creating app user ${APP_USER}"
  useradd -m -s /bin/bash "${APP_USER}"
fi

log "Preparing app directories"
mkdir -p "${APP_DIR}" /var/www/krimvk-dev
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}" /var/www/krimvk-dev

log "Configuring UFW"
ufw --force default deny incoming
ufw --force default allow outgoing
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Enabling fail2ban"
systemctl enable fail2ban
systemctl restart fail2ban

log "Enabling nginx"
systemctl enable nginx
systemctl restart nginx

cat <<EOF

Bootstrap completed.
Next steps:
1) Configure SSH hardening manually (sshd_config) and restart ssh.
2) Clone project into ${APP_DIR} (prod) and /var/www/krimvk-dev (dev) as ${APP_USER}.
3) Copy nginx.conf.example to /etc/nginx/sites-available/krimvk and enable site.
4) Create .env from .env.example.vps and run deploy script.
EOF
