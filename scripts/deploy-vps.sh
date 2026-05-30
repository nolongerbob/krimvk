#!/usr/bin/env bash

# Идемпотентный деплой на VPS:
# git sync -> npm ci -> prisma migrate -> build -> pm2 reload -> healthcheck -> rollback

set -Eeuo pipefail

APP_NAME="${APP_NAME:-krimvk}"
PORT="${PORT:-3000}"
if [[ "${APP_NAME}" == "krimvk-dev" && "${PORT}" == "3000" ]]; then
  PORT=3001
fi

DEPLOY_BRANCH="${DEPLOY_BRANCH:-}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:${PORT}/api/health}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-20}"
HEALTHCHECK_DELAY_SEC="${HEALTHCHECK_DELAY_SEC:-3}"
BACKUP_DIR=".deploy-backups"
NEXT_BACKUP_PATH=""
DEPLOY_FAILED=0

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

rollback() {
  if [[ "${DEPLOY_FAILED}" -ne 1 ]]; then
    return
  fi

  log "Запущен rollback..."
  if [[ -n "${NEXT_BACKUP_PATH}" && -d "${NEXT_BACKUP_PATH}" ]]; then
    rm -rf .next
    cp -a "${NEXT_BACKUP_PATH}" .next
    log "Восстановлена предыдущая сборка .next"
  fi

  if command -v pm2 >/dev/null 2>&1; then
    PORT="${PORT}" pm2 restart "${APP_NAME}" --update-env || true
    pm2 save || true
  fi
}

trap 'DEPLOY_FAILED=1; rollback' ERR

log "Начинаем деплой ${APP_NAME} (PORT=${PORT})"

if [[ "$(id -u)" -eq 0 && "${ALLOW_ROOT_DEPLOY:-}" != "1" ]]; then
  log "Ошибка: деплой от root запрещён (git/PM2 будут у другого пользователя)."
  log "Выполните: su - krimvk"
  log "Затем: cd /var/www/krimvk && DEPLOY_BRANCH=main ./scripts/deploy-vps.sh"
  exit 1
fi

if [[ ! -f "package.json" ]]; then
  log "Ошибка: package.json не найден. Запускайте из корня проекта."
  exit 1
fi

if [[ -d ".git" && -n "${DEPLOY_BRANCH}" ]]; then
  log "Синхронизация ветки ${DEPLOY_BRANCH}..."
  git fetch --all --prune
  git checkout "${DEPLOY_BRANCH}"
  git reset --hard "origin/${DEPLOY_BRANCH}"
fi

mkdir -p "${BACKUP_DIR}" logs

if [[ -d ".next" ]]; then
  NEXT_BACKUP_PATH="${BACKUP_DIR}/next-$(date +%Y%m%d%H%M%S)"
  cp -a .next "${NEXT_BACKUP_PATH}"
  log "Создан бэкап предыдущей сборки: ${NEXT_BACKUP_PATH}"
fi

log "Устанавливаем зависимости (npm ci)..."
npm ci

log "Генерируем Prisma Client..."
npx prisma generate

log "Применяем миграции базы данных..."
npx prisma migrate deploy || npx prisma db push --skip-generate

log "Собираем проект..."
export PORT
npm run build

if command -v pm2 >/dev/null 2>&1; then
  log "Запускаем/перезагружаем процесс через PM2 (${APP_NAME})..."
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    PORT="${PORT}" pm2 reload "${APP_NAME}" --update-env
  else
    PORT="${PORT}" pm2 start ecosystem.config.js --only "${APP_NAME}"
  fi
  pm2 save
else
  log "PM2 не установлен. Установите PM2 и повторите деплой."
  exit 1
fi

log "Проверяем healthcheck: ${HEALTHCHECK_URL}"
for i in $(seq 1 "${HEALTHCHECK_ATTEMPTS}"); do
  if curl -fsS --max-time 5 "${HEALTHCHECK_URL}" >/dev/null; then
    log "Healthcheck успешен (попытка ${i}/${HEALTHCHECK_ATTEMPTS})"
    DEPLOY_FAILED=0
    log "Деплой завершен успешно"
    exit 0
  fi
  log "Healthcheck не прошел (попытка ${i}/${HEALTHCHECK_ATTEMPTS}), ждем ${HEALTHCHECK_DELAY_SEC}s..."
  sleep "${HEALTHCHECK_DELAY_SEC}"
done

log "Healthcheck не прошел, деплой считается неуспешным"
exit 1
