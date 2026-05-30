#!/usr/bin/env bash
# Локально на Mac/Linux: ключ для GitHub Actions → VPS

set -euo pipefail

KEY_PATH="${1:-$HOME/.ssh/krimvk_deploy}"

if [[ -f "${KEY_PATH}" ]]; then
  echo "Ключ уже есть: ${KEY_PATH}"
else
  ssh-keygen -t ed25519 -C "krimvk-github-deploy" -f "${KEY_PATH}" -N ""
  echo "Создан: ${KEY_PATH}"
fi

echo ""
echo "=== Публичный ключ (на VPS в ~krimvk/.ssh/authorized_keys) ==="
cat "${KEY_PATH}.pub"
echo ""
echo "=== Приватный ключ (GitHub Secret VPS_SSH_KEY) ==="
cat "${KEY_PATH}"
echo ""
echo "Добавьте secrets: bash scripts/print-github-secrets-checklist.sh"
