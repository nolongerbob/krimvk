#!/usr/bin/env bash
# Загрузка дампа БД в Yandex Object Storage (off-site). Запуск на VPS.
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/krimvk}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups/db}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:?S3_BUCKET_NAME is required}"
S3_ENDPOINT="${S3_ENDPOINT:-https://storage.yandexcloud.net}"
S3_RETENTION_DAYS="${S3_RETENTION_DAYS:-90}"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required"
  exit 1
fi

BACKUP_FILE="${1:-}"
if [[ -z "${BACKUP_FILE}" ]]; then
  BACKUP_FILE="$(ls -t "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null | head -1 || true)"
fi

if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then
  echo "No DB backup file to upload in ${BACKUP_DIR}"
  exit 1
fi

push_via_aws_cli() {
  local BASENAME
  BASENAME="$(basename "${BACKUP_FILE}")"
  local S3_URI="s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/${BASENAME}"
  export AWS_DEFAULT_REGION="${S3_REGION:-ru-central1}"
  export AWS_EC2_METADATA_DISABLED=true

  echo "Uploading ${BACKUP_FILE} -> ${S3_URI} (aws cli)"
  aws --endpoint-url="${S3_ENDPOINT}" s3 cp "${BACKUP_FILE}" "${S3_URI}"

  local CUTOFF_EPOCH
  CUTOFF_EPOCH="$(date -d "-${S3_RETENTION_DAYS} days" +%s)"
  echo "Pruning S3 backups older than ${S3_RETENTION_DAYS} days"

  aws --endpoint-url="${S3_ENDPOINT}" s3 ls "s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/" | while read -r -a parts; do
    [[ ${#parts[@]} -lt 4 ]] && continue
    local file_epoch name
    file_epoch="$(date -d "${parts[0]} ${parts[1]}" +%s)"
    name="${parts[3]}"
    if [[ "${file_epoch}" -lt "${CUTOFF_EPOCH}" ]]; then
      aws --endpoint-url="${S3_ENDPOINT}" s3 rm "s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/${name}"
    fi
  done
}

push_via_node() {
  if [[ ! -d "${REPO_ROOT}/node_modules/@aws-sdk/client-s3" ]]; then
    echo "Run: cd ${REPO_ROOT} && npm install"
    exit 1
  fi
  node "${REPO_ROOT}/scripts/backup-push-s3.mjs" "${BACKUP_FILE}"
}

if command -v aws >/dev/null 2>&1; then
  push_via_aws_cli
else
  push_via_node
fi

echo "Done"
