#!/usr/bin/env bash
# Прописывает блок Yandex S3 в .env (остальные переменные не трогает).
# Использование:
#   ./scripts/apply-s3-env.sh 'YCAJ...' 'secret...'
#   AWS_ACCESS_KEY_ID=YCAJ... AWS_SECRET_ACCESS_KEY=secret ./scripts/apply-s3-env.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
BUCKET="${S3_BUCKET_NAME:-krimvk}"

KEY_ID="${1:-${AWS_ACCESS_KEY_ID:-}}"
SECRET="${2:-${AWS_SECRET_ACCESS_KEY:-}}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Нет файла ${ENV_FILE}" >&2
  exit 1
fi

if [[ -z "${KEY_ID}" || -z "${SECRET}" ]]; then
  echo "Использование:" >&2
  echo "  $0 'YCAJ...' 'secret...'" >&2
  echo "  AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... $0" >&2
  exit 1
fi

if [[ "${KEY_ID}" == YCAJ* ]] && [[ ${#SECRET} -lt 20 ]]; then
  echo "Предупреждение: secret очень короткий — проверьте копирование" >&2
fi

cp "${ENV_FILE}" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

# Убрать старые строки хранилища (local/s3/vercel)
grep -v -E '^(STORAGE_PROVIDER|S3_|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|STORAGE_PATH|STORAGE_BASE_URL)=' \
  "${ENV_FILE}" > "${ENV_FILE}.tmp" || true

cat >> "${ENV_FILE}.tmp" <<EOF

# Yandex Object Storage — см. docs/YANDEX_S3_SETUP.md
STORAGE_PROVIDER=s3
S3_BUCKET_NAME=${BUCKET}
S3_REGION=ru-central1
S3_ENDPOINT=https://storage.yandexcloud.net
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL_BASE=https://storage.yandexcloud.net/${BUCKET}
S3_USE_ACL=0
S3_PUBLIC_VIA_PROXY=1
AWS_ACCESS_KEY_ID=${KEY_ID}
AWS_SECRET_ACCESS_KEY=${SECRET}
EOF

mv "${ENV_FILE}.tmp" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

echo "OK: S3-блок записан в ${ENV_FILE}"
echo "     Бакет: ${BUCKET}"
echo "     Key:   ${KEY_ID:0:12}..."
echo ""
echo "Дальше:"
echo "  ./scripts/test-s3-upload.sh"
echo "  pm2 restart krimvk --update-env"
