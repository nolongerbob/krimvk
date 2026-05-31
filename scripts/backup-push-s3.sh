#!/usr/bin/env bash
# Загрузка свежего дампа БД в Yandex Object Storage (off-site). Запуск на VPS (GNU date).
set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/krimvk}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups/db}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:?S3_BUCKET_NAME is required}"
S3_ENDPOINT="${S3_ENDPOINT:-https://storage.yandexcloud.net}"
S3_RETENTION_DAYS="${S3_RETENTION_DAYS:-90}"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Install AWS CLI: sudo apt install -y awscli"
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

BASENAME="$(basename "${BACKUP_FILE}")"
S3_URI="s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/${BASENAME}"

export AWS_DEFAULT_REGION="${S3_REGION:-ru-central1}"
export AWS_EC2_METADATA_DISABLED=true

echo "Uploading ${BACKUP_FILE} -> ${S3_URI}"
aws --endpoint-url="${S3_ENDPOINT}" s3 cp "${BACKUP_FILE}" "${S3_URI}"

CUTOFF_EPOCH="$(date -d "-${S3_RETENTION_DAYS} days" +%s)"
echo "Pruning S3 backups older than ${S3_RETENTION_DAYS} days under ${BACKUP_S3_PREFIX}/"

aws --endpoint-url="${S3_ENDPOINT}" s3 ls "s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/" | while read -r -a parts; do
  [[ ${#parts[@]} -lt 4 ]] && continue
  file_epoch="$(date -d "${parts[0]} ${parts[1]}" +%s)"
  name="${parts[3]}"
  if [[ "${file_epoch}" -lt "${CUTOFF_EPOCH}" ]]; then
    echo "Deleting s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/${name}"
    aws --endpoint-url="${S3_ENDPOINT}" s3 rm "s3://${S3_BUCKET_NAME}/${BACKUP_S3_PREFIX}/${name}"
  fi
done

echo "Done"
