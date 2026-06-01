#!/usr/bin/env bash
# Проверка public ACL в приватных префиксах S3 (без обязательного aws CLI).
#
#   cd /var/www/krimvk && set -a && source .env && set +a
#   ./scripts/audit-s3-private-prefixes.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${S3_BUCKET_NAME:-}" ]]; then
  echo "S3_BUCKET_NAME is not set (source .env first)"
  exit 1
fi

exec node "$ROOT/scripts/audit-s3-private-prefixes.mjs"
