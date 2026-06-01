# Скрипты krimvk

## Production (VPS)

| Скрипт | Назначение |
|--------|------------|
| `deploy-vps.sh` | Деплой на сервере |
| `maintenance-on.sh` / `maintenance-off.sh` | Страница «Делаем сервис лучше» (см. `docs/MAINTENANCE.md`) |
| `test-auth-auto-login.sh` | Smoke: auto-login не принимает userId (после деплоя) |
| `bootstrap-vps.sh` / `vps-init.sh` | Первичная настройка VPS |
| `harden-vps.sh` | UFW, fail2ban, автообновления |
| `setup-security-vps.sh` | Hardening + nginx limits + cron бэкапа |
| `apply-nginx-rate-limits.sh` | Rate limit в nginx |
| `audit-vps.sh` | Отчёт по безопасности |
| `backup-run-daily.sh` | Ежедневный бэкап (cron) |
| `backup-db.sh` / `restore-db.sh` | Дамп и восстановление БД |
| `backup-push-s3.mjs` | Off-site в Yandex S3 |
| `setup-backup-cron.sh` | Установка cron |
| `ufw-cloudflare-origin.sh` | Firewall только Cloudflare |
| `setup-yandex-s3.sh` | Настройка Object Storage |
| `test-s3-upload.sh` / `apply-s3-env.sh` | S3 диагностика |
| `generate-deploy-ssh-key.sh` | Ключ для GitHub Actions |
| `install-monitoring-vps.sh` | Grafana/Prometheus |
| `test-ntfy-alert.sh` | Проверка алертов |

## Локальная разработка

| Скрипт | Назначение |
|--------|------------|
| `load-env.js` | Загрузка `.env` для Node-скриптов |
| `make-admin.js` / `create-admin.js` | Админ-пользователь |
| `check-db.js` | Проверка БД |
| `create-test-*.js` | Тестовые данные |
| `seed-services.js` | Сиды услуг |
| `rewrite-s3-file-urls.js` | Миграция URL файлов в БД |

Документация: [docs/VPS_DEPLOYMENT.md](../docs/VPS_DEPLOYMENT.md), [docs/BACKUPS.md](../docs/BACKUPS.md), [docs/WEB_SECURITY.md](../docs/WEB_SECURITY.md).
