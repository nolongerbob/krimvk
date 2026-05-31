# Резервное копирование (VPS)

## Что бэкапится

| Что | Скрипт | Куда |
|-----|--------|------|
| **PostgreSQL** | `backup-db.sh` | `/var/backups/krimvk/db_*.sql.gz` |
| **uploads** (если локально) | `backup-uploads.sh` | `/var/backups/krimvk/uploads_*.tar.gz` |
| **uploads на S3** | — | бэкап бакета в [Yandex Cloud](https://cloud.yandex.ru/docs/storage/operations/buckets/backup) |

Хранение на диске VPS: **14 дней** (`RETENTION_DAYS`), старше — удаляются автоматически.

---

## Быстрая настройка (на VPS под krimvk)

```bash
ssh krimvk@VPS_IP
cd /var/www/krimvk
git pull origin main

sudo apt install -y postgresql-client
chmod +x scripts/setup-backup-cron.sh scripts/backup-run-daily.sh

# тест вручную
./scripts/backup-run-daily.sh

# cron каждый день в 02:00 MSK (время сервера)
./scripts/setup-backup-cron.sh
```

Проверка:

```bash
ls -lh /var/backups/krimvk/
tail -20 /var/www/krimvk/logs/backup.log
crontab -l
```

---

## Восстановление БД (осторожно)

```bash
cd /var/www/krimvk
set -a && source .env && set +a
ls -lh /var/backups/krimvk/db_*.sql.gz | tail -3

# на тестовую копию или после остановки сайта:
# pm2 stop krimvk
./scripts/restore-db.sh /var/backups/krimvk/db_YYYYMMDD_HHMMSS.sql.gz
# pm2 start krimvk
```

Раз в месяц — пробное восстановление на отдельную БД или staging.

---

## Файлы на Yandex S3

Если `STORAGE_PROVIDER=s3` в `.env`, локальный `uploads` не архивируется — файлы уже в бакете.

Рекомендуется в консоли Yandex:

- versioning на бакете, или
- lifecycle / второй бакет для копий

---

## Копия off-site (рекомендуется)

Бэкапы только на том же VPS не спасут при поломке диска. Варианты:

1. **rsync/scp на Mac** раз в неделю:
   ```bash
   scp krimvk@VPS:/var/backups/krimvk/db_*.sql.gz ~/Backups/krimvk/
   ```
2. **Yandex Object Storage** — загрузка `.sql.gz` через `aws s3 cp` (совместимый CLI).
3. **Второй VPS / NAS** — cron + `rsync`.

---

## Переменные (опционально)

В `.env` или перед запуском:

```env
BACKUP_DIR=/var/backups/krimvk
RETENTION_DAYS=14
```

Другое время cron:

```bash
CRON_SCHEDULE="0 3 * * *" ./scripts/setup-backup-cron.sh
```

---

## Связанные документы

- [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md)
- [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
