#!/usr/bin/env bash
# Проверка: есть ли объекты с публичным ACL в приватных префиксах бакета.
# Требует AWS CLI, настроенный на Yandex Object Storage (см. docs/YANDEX_S3_SETUP.md).
#
#   cd /var/www/krimvk && set -a && source .env && set +a
#   ./scripts/audit-s3-private-prefixes.sh

set -euo pipefail

BUCKET="${S3_BUCKET_NAME:-}"
ENDPOINT="${S3_ENDPOINT:-https://storage.yandexcloud.net}"

if [[ -z "$BUCKET" ]]; then
  echo "S3_BUCKET_NAME is not set"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found"
  exit 1
fi

PREFIXES=(applications messages meters contracts)
FOUND=0

for prefix in "${PREFIXES[@]}"; do
  echo "=== s3://${BUCKET}/${prefix}/ ==="
  keys=$(aws s3api list-objects-v2 \
    --bucket "$BUCKET" \
    --prefix "${prefix}/" \
    --endpoint-url "$ENDPOINT" \
    --query 'Contents[].Key' \
    --output text 2>/dev/null || true)

  if [[ -z "$keys" || "$keys" == "None" ]]; then
    echo "(no objects)"
    continue
  fi

  for key in $keys; do
    acl=$(aws s3api get-object-acl \
      --bucket "$BUCKET" \
      --key "$key" \
      --endpoint-url "$ENDPOINT" \
      --output json 2>/dev/null || echo '{}')
    if echo "$acl" | grep -q 'AllUsers'; then
      echo "PUBLIC: $key"
      FOUND=$((FOUND + 1))
    fi
  done
done

if [[ "$FOUND" -eq 0 ]]; then
  echo "OK: no public-read objects in private prefixes (checked via AllUsers grant)."
else
  echo "WARN: $FOUND object(s) with public ACL — re-upload or fix ACL in console."
  exit 1
fi
