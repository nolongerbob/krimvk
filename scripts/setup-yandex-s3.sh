#!/usr/bin/env bash
# Полная настройка Yandex Object Storage для krimvk через Yandex Cloud CLI.
#
# Требования: yc init (OAuth), jq, curl; на VPS/Mac в каталоге репозитория.
#
# Использование:
#   ./scripts/setup-yandex-s3.sh              # создать SA, бакет, ключ, показать команды для VPS
#   ./scripts/setup-yandex-s3.sh --apply-env  # + записать ключи в .env и прогнать test-s3-upload.sh
#   ./scripts/setup-yandex-s3.sh --public-read  # + публичное чтение объектов (--public-read)
#
# Переменные (опционально):
#   S3_BUCKET_NAME=krimvk  YC_SA_NAME=krimvk-s3  YC_FOLDER_ID=b1g...
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

BUCKET="${S3_BUCKET_NAME:-krimvk}"
SA_NAME="${YC_SA_NAME:-krimvk-s3}"
APPLY_ENV=0
PUBLIC_READ=0

for arg in "$@"; do
  case "$arg" in
    --apply-env) APPLY_ENV=1 ;;
    --public-read) PUBLIC_READ=1 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $arg" >&2
      exit 1
      ;;
  esac
done

log() { printf '→ %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Нужна команда «$1». Установите и повторите."
}

json_field() {
  local expr=$1
  python3 -c "import json,sys; d=json.load(sys.stdin); print(${expr})"
}

need_cmd yc
need_cmd curl
need_cmd python3

if ! yc config list >/dev/null 2>&1; then
  die "yc не настроен. Выполните: yc init"
fi

FOLDER_ID="${YC_FOLDER_ID:-$(yc config get folder-id 2>/dev/null || true)}"
[[ -n "${FOLDER_ID}" ]] || die "Не задан folder-id. yc init или export YC_FOLDER_ID=..."

log "Каталог: ${FOLDER_ID}"
log "Бакет: ${BUCKET}, SA: ${SA_NAME}"

# --- Права текущему пользователю (консоль Object Storage) ---
if USER_JSON="$(yc iam user-account get --format json 2>/dev/null)"; then
  USER_ID="$(printf '%s' "${USER_JSON}" | json_field "d.get('id','')")"
  if [[ -n "${USER_ID}" ]]; then
    log "Роль storage.editor вашему аккаунту (${USER_ID})…"
    yc resource-manager folder add-access-binding \
      --id "${FOLDER_ID}" \
      --role storage.editor \
      --user-account-id "${USER_ID}" 2>/dev/null || log "(роль уже есть или нет прав — ок)"
  fi
fi

# --- Сервисный аккаунт ---
if SA_JSON="$(yc iam service-account get --name "${SA_NAME}" --format json 2>/dev/null)"; then
  SA_ID="$(printf '%s' "${SA_JSON}" | json_field "d['id']")"
  log "SA существует: ${SA_NAME} (${SA_ID})"
else
  log "Создаю SA ${SA_NAME}…"
  SA_ID="$(yc iam service-account create --name "${SA_NAME}" --folder-id "${FOLDER_ID}" --format json | json_field "d['id']")"
fi

log "Роль storage.editor SA на каталог…"
yc resource-manager folder add-access-binding \
  --id "${FOLDER_ID}" \
  --role storage.editor \
  --service-account-id "${SA_ID}" 2>/dev/null || log "(роль уже есть)"

# --- Статический ключ (новый каждый запуск) ---
log "Создаю новый статический ключ…"
KEY_JSON="$(yc iam access-key create --service-account-id "${SA_ID}" --description "krimvk s3 $(date +%Y%m%d)" --format json)"
AWS_KEY_ID="$(printf '%s' "${KEY_JSON}" | json_field "d['access_key']['key_id']")"
AWS_SECRET="$(printf '%s' "${KEY_JSON}" | json_field "d['secret']")"
[[ -n "${AWS_KEY_ID}" && -n "${AWS_SECRET}" ]] || die "Не удалось создать access-key"

log "Key ID: ${AWS_KEY_ID:0:14}…"

# --- Бакет (без KMS, static keys разрешены) ---
if yc storage bucket get --name "${BUCKET}" >/dev/null 2>&1; then
  log "Бакет ${BUCKET} уже есть — обновляю настройки…"
else
  log "Создаю бакет ${BUCKET}…"
  yc storage bucket create --name "${BUCKET}" --default-storage-class standard
fi

yc storage bucket update --name "${BUCKET}" --remove-encryption --disable-statickey-auth=false

if [[ "${PUBLIC_READ}" -eq 1 ]]; then
  log "Публичное чтение объектов (--public-read)…"
  yc storage bucket update --name "${BUCKET}" --public-read
fi

# --- Роль SA на бакете (REST API; в yc CLI отдельной команды нет) ---
log "Роль storage.editor SA на бакете…"
IAM_TOKEN="$(yc iam create-token)"
STORAGE_API="${YC_STORAGE_API:-https://storage.api.cloud.yandex.net}"
HTTP_CODE="$(curl -sS -o /tmp/krimvk-s3-binding.json -w '%{http_code}' \
  -X PATCH "${STORAGE_API}/storage/v1/buckets/${BUCKET}:updateAccessBindings" \
  -H "Authorization: Bearer ${IAM_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"accessBindingDeltas\":[{\"action\":\"ADD\",\"accessBinding\":{\"roleId\":\"storage.editor\",\"subject\":{\"id\":\"${SA_ID}\",\"type\":\"serviceAccount\"}}}]}")"
if [[ "${HTTP_CODE}" != "200" ]]; then
  log "Предупреждение: updateAccessBindings HTTP ${HTTP_CODE} (часто роль уже есть на каталоге)"
  [[ -f /tmp/krimvk-s3-binding.json ]] && cat /tmp/krimvk-s3-binding.json >&2 || true
fi

# --- Сохранить ключи локально (не в git) ---
CREDS_FILE="${REPO_ROOT}/.env.s3.generated"
umask 077
cat > "${CREDS_FILE}" <<EOF
# Сгенерировано $(date -u +"%Y-%m-%dT%H:%M:%SZ") — не коммитить
AWS_ACCESS_KEY_ID=${AWS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET}
S3_BUCKET_NAME=${BUCKET}
EOF
chmod 600 "${CREDS_FILE}"
log "Ключи сохранены в ${CREDS_FILE}"

# --- .env на этом хосте (VPS) ---
if [[ "${APPLY_ENV}" -eq 1 ]]; then
  log "Записываю .env…"
  "${REPO_ROOT}/scripts/apply-s3-env.sh" "${AWS_KEY_ID}" "${AWS_SECRET}"
  log "Тест S3…"
  "${REPO_ROOT}/scripts/test-s3-upload.sh"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart krimvk --update-env 2>/dev/null || true
  fi
fi

cat <<EOF

════════════════════════════════════════════════════════════
Готово в Yandex Cloud.

Если ещё не применили на VPS:

  cd /var/www/krimvk
  git pull
  ./scripts/apply-s3-env.sh '${AWS_KEY_ID}' '${AWS_SECRET}'
  ./scripts/test-s3-upload.sh
  pm2 restart krimvk --update-env

Или одной командой на VPS (после git pull):

  ./scripts/setup-yandex-s3.sh --apply-env

Публичные ссылки (после PutObject OK):

  ./scripts/setup-yandex-s3.sh --public-read --apply-env
  # или: yc storage bucket update --name ${BUCKET} --public-read

Secret показан один раз — он в ${CREDS_FILE}
════════════════════════════════════════════════════════════
EOF
