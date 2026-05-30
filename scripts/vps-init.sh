#!/usr/bin/env bash
#
# Первичная настройка VPS (запуск на сервере под root):
#   curl -fsSL ... | bash
#   или: sudo bash scripts/vps-init.sh
#
# Переменные:
#   REPO_URL   — git URL (default: https://github.com/nolongerbob2/krimvk.git)
#   APP_USER   — default: krimvk

set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/nolongerbob2/krimvk.git}"
APP_USER="${APP_USER:-krimvk}"
PROD_DIR="/var/www/krimvk"
DEV_DIR="/var/www/krimvk-dev"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите: sudo bash scripts/vps-init.sh"
  exit 1
fi

log "Bootstrap пакетов..."
apt update -y
apt install -y curl ca-certificates git nginx ufw fail2ban

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

command -v pm2 >/dev/null 2>&1 || npm install -g pm2

id -u "${APP_USER}" >/dev/null 2>&1 || useradd -m -s /bin/bash "${APP_USER}"

mkdir -p "${PROD_DIR}" "${DEV_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${PROD_DIR}" "${DEV_DIR}"

ufw --force default deny incoming
ufw --force default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw --force enable

systemctl enable fail2ban nginx
systemctl restart fail2ban nginx

clone_if_empty() {
  local dir="$1"
  local branch="$2"
  if [[ -d "${dir}/.git" ]]; then
    log "Git уже есть в ${dir}, пропуск clone"
    return
  fi
  log "Клонирование ${REPO_URL} -> ${dir} (${branch})"
  sudo -u "${APP_USER}" -H git clone --branch "${branch}" "${REPO_URL}" "${dir}" 2>/dev/null \
    || sudo -u "${APP_USER}" -H bash -lc "git clone '${REPO_URL}' '${dir}' && cd '${dir}' && git checkout '${branch}'"
}

clone_if_empty "${PROD_DIR}" main
clone_if_empty "${DEV_DIR}" develop

setup_env() {
  local dir="$1"
  local example="$2"
  local target="$3"
  if [[ ! -f "${dir}/${target}" && -f "${dir}/${example}" ]]; then
    cp "${dir}/${example}" "${dir}/${target}"
    chown "${APP_USER}:${APP_USER}" "${dir}/${target}"
    chmod 600 "${dir}/${target}"
    log "Создан ${dir}/${target} — отредактируйте DATABASE_URL и секреты"
  fi
}

setup_env "${PROD_DIR}" ".env.example.vps" ".env"
setup_env "${DEV_DIR}" ".env.example.dev" ".env.dev"

if [[ -f "${PROD_DIR}/nginx.conf.ip-first.example" ]]; then
  cp "${PROD_DIR}/nginx.conf.ip-first.example" /etc/nginx/sites-available/krimvk
  ln -sf /etc/nginx/sites-available/krimvk /etc/nginx/sites-enabled/krimvk
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  log "Nginx: prod http://<IP>/ , dev http://<IP>:8080/"
fi

cat <<EOF

=== VPS init готов ===

Дальше:
1) Отредактируйте ${PROD_DIR}/.env и ${DEV_DIR}/.env.dev
2) Добавьте SSH-ключ deploy в /home/${APP_USER}/.ssh/authorized_keys
3) Первый деплой:
   sudo -u ${APP_USER} -H bash -lc 'cd ${PROD_DIR} && chmod +x scripts/deploy-vps.sh && APP_NAME=krimvk PORT=3000 DEPLOY_BRANCH=main ./scripts/deploy-vps.sh'
   sudo -u ${APP_USER} -H bash -lc 'cd ${DEV_DIR} && APP_NAME=krimvk-dev PORT=3001 DEPLOY_BRANCH=develop ./scripts/deploy-vps.sh'
4) pm2 startup + pm2 save (под ${APP_USER})
5) GitHub Secrets — см. docs/GITHUB_SECRETS.md или: bash scripts/print-github-secrets-checklist.sh

Репозиторий: ${REPO_URL}
EOF
