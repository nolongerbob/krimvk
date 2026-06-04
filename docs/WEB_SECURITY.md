# Защита сайта от атак (VPS + приложение)

Чеклист для production. Выполняйте по порядку.

## Быстрый старт на VPS (одна команда)

```bash
cd /var/www/krimvk
git pull origin main
sudo bash scripts/harden-vps.sh
```

Это: **UFW** (только 22/80/443), **fail2ban**, **unattended-upgrades**, snippet nginx для rate limit.

---

## 1. Перimeter (сеть)

| Мера | Зачем |
|------|--------|
| **UFW** deny incoming | закрыты все порты кроме SSH/HTTP/HTTPS |
| **Grafana/Prometheus/3030** | только `127.0.0.1` (уже так) |
| **PostgreSQL** | только localhost, не 0.0.0.0 |
| **fail2ban** | бан IP после brute-force SSH/nginx |

Проверка:

```bash
sudo ufw status verbose
sudo fail2ban-client status sshd
ss -tlnp | grep -E '5432|3030|9090'
```

---

## 2. Nginx (первая линия против DDoS и сканеров)

### Подключить rate limit

```bash
sudo cp /var/www/krimvk/nginx/krimvk-security.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

В `sites-available/krimvk` внутри `server { }` добавьте (см. `nginx.conf.example`):

```nginx
limit_conn krimvk_conn 30;

location = /api/auth/verify-email {
    limit_req zone=krimvk_verify_email burst=20 nodelay;
    proxy_pass http://krimvk_prod;
    # ... proxy_set_header как в location /
}

location = /api/auth/check-email-verified {
    limit_req zone=krimvk_verify_email burst=20 nodelay;
    proxy_pass http://krimvk_prod;
}

location /api/auth/ {
    limit_req zone=krimvk_auth burst=5 nodelay;
    proxy_pass http://krimvk_prod;
    # ... proxy_set_header как в location /
}
```

location /api/admin/ {
    limit_req zone=krimvk_admin burst=20 nodelay;
    proxy_pass http://krimvk_prod;
    # ...
}

location / {
    limit_req zone=krimvk_general burst=40 nodelay;
    proxy_pass http://krimvk_prod;
    # ...
}
```

### Заголовки безопасности

Уже в `nginx.conf.example`: HSTS, X-Frame-Options, nosniff, Referrer-Policy.

### Блокировка мусорных путей

В приложении (`middleware.ts`): `.env`, `.git`, `wp-admin`, `phpmyadmin` → **404**.

---

## 3. Приложение (Next.js)

| Мера | Где |
|------|-----|
| Rate limit API | `lib/security/http-guard.ts` + `middleware.ts` |
| Защита `/admin`, `/dashboard` | JWT через NextAuth |
| Секреты | только `.env`, chmod 600 |
| Загрузки | лимит 50M в nginx, валидация типов в API |
| Health | `/api/health` без лимита |
| Auto-login после verify | только `loginToken` (HMAC), не `userId` — `lib/post-verify-login-token.ts` |
| Приватные файлы | `applications/`, `messages/`, `meters/`, `contracts/` → `/api/files/private/...` с проверкой сессии |
| Пароли 1С в БД | AES-256-GCM (`PASSWORD1C_ENCRYPTION_KEY`) — `docs/PASSWORD1C_ENCRYPTION.md` |
| CSP | `lib/security/csp.ts` + заголовки в `next.config.js` |
| Админ API/страницы | `requireAdmin()` / `app/admin/layout.tsx` — роль из БД |
| DaData | только `/api/address/suggest`, сессия + 40 req/min |
| Статус аудита | [SECURITY_AUDIT_STATUS.md](./SECURITY_AUDIT_STATUS.md) |

Публично без входа: `disclosure/`, `news/`, `water-quality/`, `pages/`, `posts/` — `/files/...`

Лимиты (in-memory, один PM2):

- login/register/forgot: **10/мин** с IP  
- остальной `/api/auth`: **30/мин**  
- `/api/admin`: **120/мин**  
- общий `/api`: **200/мин**

После деплоя:

```bash
cd /var/www/krimvk
git pull && DEPLOY_BRANCH=main ./scripts/deploy-vps.sh
```

---

## 4. SSH и пользователи

```bash
sudo nano /etc/ssh/sshd_config
```

```
PasswordAuthentication no
PermitRootLogin no
AllowUsers krimvk
```

```bash
sudo systemctl reload sshd
```

Деплой и PM2 — только от **krimvk**, не root.

---

## 5. База данных

```bash
sudo -u postgres psql -c "SHOW listen_addresses;"
# должно быть localhost или пусто/127.0.0.1

sudo grep listen_addresses /etc/postgresql/*/main/postgresql.conf
```

Отдельные пользователи: приложение (`krimvk_user`), метрики (`krimvk_metrics` — только read).

---

## 6. HTTPS и домен

- Certbot, редирект 80→443  
- `NEXTAUTH_URL=https://ваш-домен`  
- Cookies: Secure (NextAuth в production)

---

## 7. Мониторинг атак

| Сигнал | Где смотреть |
|--------|----------------|
| 429 rate limit | `/var/log/nginx/access.log` |

**429 при подтверждении email из письма:** почтовые сканеры и опрос статуса бьют в общий `/api/auth/`. Патч:

```bash
cd /var/www/krimvk && git pull
sudo bash scripts/patch-nginx-verify-email-limits.sh
pm2 restart krimvk   # если меняли http-guard в приложении
```
| fail2ban ban | `sudo fail2ban-client status nginx-limit-req` |
| Подозрительные запросы | `sudo tail -f /var/log/nginx/access.log` |
| Алерт | ntfy / UptimeRobot |

```bash
sudo grep '" 429 ' /var/log/nginx/access.log | tail -20
sudo grep -E 'wp-admin|\.env|phpmyadmin' /var/log/nginx/access.log | tail -20
```

---

## 8. Что не защитит один VPS

- Крупный **DDoS** (нужен CDN/WAF: Cloudflare, QRATOR, DDoS-Guard) — см. [CLOUDFLARE.md](./CLOUDFLARE.md)  
- **0-day** в зависимостях — держите `npm audit`, обновления  
- Утечка **секретов** из git — `.gitignore`, ротация ключей  

---

## 9. Регулярно

- [ ] `sudo apt update && sudo apt upgrade` (или unattended-upgrades)  
- [ ] `npm audit` перед релизом  
- [ ] Бэкапы БД (cron)  
- [ ] Проверка `/api/health`  

---

## Связанные файлы

- [SERVER_HARDENING.md](./SERVER_HARDENING.md)  
- [MOBILE_MONITORING.md](./MOBILE_MONITORING.md)  
- `scripts/harden-vps.sh`  
- `nginx/krimvk-security.conf`  
- `monitoring/fail2ban/jail.local.example`
