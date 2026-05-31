#!/usr/bin/env bash
# Отчёт по безопасности VPS. Запуск: sudo bash scripts/audit-vps.sh
set -uo pipefail

section() { echo ""; echo "========== $* =========="; }

section "HOST"
hostname; date -Is; whoami

section "UFW"
ufw status verbose 2>/dev/null || echo "ufw: unavailable"

section "FAIL2BAN"
fail2ban-client status 2>/dev/null || echo "fail2ban: not running"
fail2ban-client status sshd 2>/dev/null || true

section "SSH"
grep -E '^(PermitRootLogin|PasswordAuthentication|AllowUsers|Port) ' /etc/ssh/sshd_config 2>/dev/null | grep -v '^#' || true

section "LISTEN"
ss -tlnp | grep LISTEN | head -25

section "NGINX RATE LIMITS"
if grep -r limit_req /etc/nginx/sites-enabled/ /etc/nginx/sites-available/krimvk 2>/dev/null | grep -q limit_req; then
  grep -h limit_req /etc/nginx/sites-available/krimvk 2>/dev/null | head -5
else
  echo "limit_req: not configured"
fi
test -f /etc/nginx/conf.d/krimvk-security.conf && head -3 /etc/nginx/conf.d/krimvk-security.conf || true
nginx -t 2>&1 | tail -2

section "CRON BACKUP"
crontab -l 2>/dev/null | grep -E 'backup|krimvk' || echo "root crontab: no backup"
crontab -u krimvk -l 2>/dev/null | grep -E 'backup|krimvk' || echo "krimvk crontab: no backup"

section "BACKUPS"
ls -lh /var/backups/krimvk/ 2>/dev/null || echo "no /var/backups/krimvk"

section ".env"
ls -la /var/www/krimvk/.env 2>/dev/null || true

section "PM2 (krimvk)"
sudo -u krimvk pm2 list 2>/dev/null | head -8 || true

section "CLOUDFLARE"
curl -fsSI https://krimvk.ru/api/health 2>/dev/null | grep -iE '^(HTTP|cf-|server)' || true

echo ""
echo "=== audit done ==="
