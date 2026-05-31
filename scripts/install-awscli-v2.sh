#!/usr/bin/env bash
# Опционально: AWS CLI v2, если нужна команда aws в shell (бэкапы работают и без неё через Node).
set -euo pipefail

if command -v aws >/dev/null 2>&1; then
  aws --version
  exit 0
fi

sudo apt install -y unzip curl
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64) ZIP=awscli-exe-linux-x86_64.zip ;;
  aarch64) ZIP=awscli-exe-linux-aarch64.zip ;;
  *)
    echo "Unsupported arch: ${ARCH}. Use Node uploader (default) or install aws manually."
    exit 1
    ;;
esac

curl -fsSL "https://awscli.amazonaws.com/${ZIP}" -o "${TMP}/${ZIP}"
unzip -q "${TMP}/${ZIP}" -d "${TMP}"
sudo "${TMP}/aws/install" --update
aws --version
