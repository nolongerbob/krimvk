#!/usr/bin/env bash
# Локально: напоминание, какие secrets добавить в GitHub

REPO="${GITHUB_REPO:-nolongerbob2/krimvk}"

cat <<EOF
GitHub → https://github.com/${REPO}/settings/secrets/actions

Repository secrets:
  VPS_HOST          = <IP VPS>
  VPS_PORT          = 22
  VPS_USER          = krimvk
  VPS_SSH_KEY       = <приватный ключ, см. scripts/generate-deploy-ssh-key.sh>
  VPS_APP_DIR       = /var/www/krimvk
  VPS_APP_DIR_DEV   = /var/www/krimvk-dev
  HEALTHCHECK_URL   = http://127.0.0.1:3000/api/health
  HEALTHCHECK_URL_DEV = http://127.0.0.1:3001/api/health

Environments (Settings → Environments):
  production   — для main
  development  — для develop

Ветка develop:
  git checkout -b develop && git push -u origin develop
EOF
