#!/usr/bin/env bash
# Ослабляет rate limit для подтверждения email (429 при клике из письма).
# Запуск на VPS: sudo bash scripts/patch-nginx-verify-email-limits.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo bash scripts/patch-nginx-verify-email-limits.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="/etc/nginx/sites-available/krimvk"
CONF="/etc/nginx/conf.d/krimvk-security.conf"
MARKER="# krimvk-verify-email-limits"

if [[ ! -f "${SITE}" ]]; then
  echo "Not found: ${SITE}"
  exit 1
fi

cp "${REPO_ROOT}/nginx/krimvk-security.conf" "${CONF}"

if grep -q "${MARKER}" "${SITE}"; then
  echo "Verify-email limits already patched in ${SITE}"
  nginx -t && systemctl reload nginx
  exit 0
fi

cp -a "${SITE}" "${SITE}.bak.$(date +%Y%m%d%H%M%S)"

python3 <<'PY'
from pathlib import Path

site = Path("/etc/nginx/sites-available/krimvk")
text = site.read_text()
marker = "# krimvk-verify-email-limits"

if marker in text:
    raise SystemExit(0)

proxy_headers = """        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;"""

block = f"""
    {marker}
    location = /api/auth/verify-email {{
        limit_req zone=krimvk_verify_email burst=20 nodelay;
        proxy_pass http://krimvk_prod;
{proxy_headers}
    }}

    location = /api/auth/check-email-verified {{
        limit_req zone=krimvk_verify_email burst=20 nodelay;
        proxy_pass http://krimvk_prod;
{proxy_headers}
    }}

"""

needle = "    location /api/auth/ {"
if needle not in text:
    raise SystemExit("location /api/auth/ not found — patch manually")

site.write_text(text.replace(needle, block + needle, 1))
print("Patched", site)
PY

nginx -t
systemctl reload nginx
echo "Verify-email nginx limits applied."
