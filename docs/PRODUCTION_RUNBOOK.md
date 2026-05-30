# Production Runbook (nic.ru VPS)

## 1. Базовые команды

```bash
cd /var/www/krimvk
pm2 status
pm2 logs krimvk --lines 200
curl -fsS http://127.0.0.1:3000/api/health
sudo nginx -t && sudo systemctl reload nginx
```

## 2. Стандартный релиз

1. Merge в `main`.
2. Дождаться workflow `Deploy VPS`.
3. Проверить:
   - `curl -fsS https://yourdomain.ru/api/health`
   - ключевые пользовательские сценарии (логин, отправка формы, загрузка файлов).

## 3. Ручной rollback

Если автодеплой не прошел или обнаружен критичный дефект:

```bash
cd /var/www/krimvk
pm2 logs krimvk --lines 200
ls -1 .deploy-backups | tail -n 5
rm -rf .next
cp -a ".deploy-backups/<backup_folder>" .next
pm2 restart krimvk --update-env
pm2 save
curl -fsS http://127.0.0.1:3000/api/health
```

## 4. Мониторинг (Grafana / Prometheus)

Стек в `monitoring/`, установка: [MONITORING_AND_SECURITY.md](./MONITORING_AND_SECURITY.md).

```bash
cd /var/www/krimvk/monitoring && docker compose --profile core ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3030/login
```

Доступ к дашбордам с локальной машины: `ssh -L 3030:127.0.0.1:3030 krimvk@VPS_IP` → http://localhost:3030

## 5. Резервные копии

Скрипты:
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `scripts/backup-uploads.sh`

Пример cron:

```cron
0 2 * * * cd /var/www/krimvk && DATABASE_URL="postgresql://..." ./scripts/backup-db.sh >> /var/log/krimvk-backup.log 2>&1
30 2 * * * cd /var/www/krimvk && UPLOADS_DIR="/var/www/krimvk/uploads" ./scripts/backup-uploads.sh >> /var/log/krimvk-backup.log 2>&1
```

## 6. Инциденты

1. Зафиксировать время начала, симптом и затронутые функции.
2. Проверить `pm2 logs`, `nginx error.log`, `/api/health`.
3. При недоступности после релиза — rollback.
4. После восстановления:
   - краткий постмортем;
   - список корректирующих действий;
   - обновление чеклистов/мониторинга.

## 7. Комплаенс РФ (операционно)

Перед каждым крупным релизом проверять:
- доступны `/legal/privacy`, `/legal/terms`, `/legal/cookies`;
- cookie-consent баннер показывается новым пользователям;
- секреты отсутствуют в git и CI logs;
- доступ к production и БД ограничен по принципу least privilege;
- есть свежие проверенные бэкапы БД и файлов.

## 8. Ссылки на регламенты

- Мониторинг и безопасность: `docs/MONITORING_AND_SECURITY.md`
- Hardening: `docs/SERVER_HARDENING.md`
- Go-live: `docs/GO_LIVE_CHECKLIST.md`
- GitHub secrets: `docs/GITHUB_SECRETS.md`
