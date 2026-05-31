# Резервное копирование (VPS)

## Что бэкапится

| Что | Скрипт | Куда |
|-----|--------|------|
| **PostgreSQL** | `backup-db.sh` | `/var/backups/krimvk/db_*.sql.gz` |
| **uploads** (если локально) | `backup-uploads.sh` | `/var/backups/krimvk/uploads_*.tar.gz` |
| **uploads на S3** | — | versioning / lifecycle в [Yandex Cloud](https://cloud.yandex.ru/docs/storage/operations/buckets/backup) |
| **дамп БД off-site** | `backup-push-s3.sh` | `s3://<bucket>/backups/db/db_*.sql.gz` (90 дней) |

Хранение на диске VPS: **14 дней** (`RETENTION_DAYS`), старше — удаляются автоматически.

---

## Быстрая настройка (на VPS под krimvk)

```bash
ssh krimvk@VPS_IP
cd /var/www/krimvk
git pull origin main

sudo apt install -y postgresql-client
# off-site в тот же бакет (ключи уже в .env):
# echo 'BACKUP_S3_ENABLED=1' >> .env
# sudo apt install -y awscli

chmod +x scripts/setup-backup-cron.sh scripts/backup-run-daily.sh

# тест вручную
./scripts/backup-run-daily.sh

# cron каждый день в 02:00 (время сервера)
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

## Off-site в Yandex Object Storage (рекомендуется)

В `.env` на VPS (ключи S3 уже есть для uploads):

```env
BACKUP_S3_ENABLED=1
BACKUP_S3_PREFIX=backups/db
S3_RETENTION_DAYS=90
```

```bash
sudo apt install -y awscli
./scripts/backup-run-daily.sh
aws --endpoint-url=https://storage.yandexcloud.net s3 ls s3://krimvk/backups/db/
```

Префикс `backups/db/` отделён от пользовательских файлов в бакете. Права SA: `storage.editor` на бакет достаточно.

Другие варианты off-site:

1. **scp на Mac** раз в неделю: `scp krimvk@89.111.165.160:/var/backups/krimvk/db_*.sql.gz ~/Backups/krimvk/`
2. **Второй VPS** — `rsync` по cron.

---

## Переменные (опционально)

В `.env` или перед запуском:

```env
BACKUP_DIR=/var/backups/krimvk
RETENTION_DAYS=14
BACKUP_S3_ENABLED=1
BACKUP_S3_PREFIX=backups/db
S3_RETENTION_DAYS=90
```

Другое время cron:

```bash
CRON_SCHEDULE="0 3 * * *" ./scripts/setup-backup-cron.sh
```

---

## Связанные документы

- [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md)
- [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
