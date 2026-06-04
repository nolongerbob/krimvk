#!/usr/bin/env bash
# Добавляет rate limit locations в sites-available/krimvk (443 server block).
# Запуск: sudo bash scripts/apply-nginx-rate-limits.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo bash scripts/apply-nginx-rate-limits.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="/etc/nginx/sites-available/krimvk"
MARKER="# krimvk-rate-limits-applied"

if [[ ! -f "${SITE}" ]]; then
  echo "Not found: ${SITE}"
  exit 1
fi

if grep -q "${MARKER}" "${SITE}"; then
  echo "Rate limits already applied in ${SITE}"
  exit 0
fi

cp -a "${SITE}" "${SITE}.bak.$(date +%Y%m%d%H%M%S)"
cp "${REPO_ROOT}/nginx/krimvk-security.conf" /etc/nginx/conf.d/krimvk-security.conf

python3 <<'PY'
from pathlib import Path

site = Path("/etc/nginx/sites-available/krimvk")
text = site.read_text()
marker = "# krimvk-rate-limits-applied"

if marker in text:
    raise SystemExit(0)

proxy_headers = """        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;"""

blocks = f"""
    {marker}
    limit_conn krimvk_conn 30;

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

    location /api/auth/ {{
        limit_req zone=krimvk_auth burst=5 nodelay;
        proxy_pass http://krimvk_prod;
{proxy_headers}
    }}

    location /api/admin/ {{
        limit_req zone=krimvk_admin burst=20 nodelay;
        proxy_pass http://krimvk_prod;
{proxy_headers}
    }}

    location /api/health {{
        proxy_pass http://krimvk_prod;
{proxy_headers}
    }}
"""

# Insert before first "location /_next/" or "location / {"
for needle in ("    location /_next/ {", "    location / {"):
    if needle in text:
        text = text.replace(needle, blocks + "\n" + needle, 1)
        break
else:
    raise SystemExit("Could not find location / block in nginx site")

# Add limit_req to main location / if not present
if "limit_req zone=krimvk_general" not in text:
    text = text.replace(
        "    location / {\n        proxy_pass",
        "    location / {\n        limit_req zone=krimvk_general burst=40 nodelay;\n        proxy_pass",
        1,
    )

site.write_text(text)
print("Patched", site)
PY

nginx -t
systemctl reload nginx
echo "nginx rate limits applied and reloaded"
