# Мониторинг, контроль и безопасность (VPS)

После того как сайт поднят, этот документ описывает **наблюдаемость** (графики, алерты) и **операционную безопасность** в одном контуре.

## Архитектура

```mermaid
flowchart LR
  subgraph VPS
    Nginx --> App[Next.js PM2 :3000]
    App --> PG[(PostgreSQL)]
    NE[node-exporter]
    PE[postgres-exporter]
    BB[blackbox-exporter]
    Prom[Prometheus]
    Graf[Grafana :3030]
    NE --> Prom
    PE --> Prom
    BB --> Prom
    Prom --> Graf
  end
  Admin[Вы] -->|SSH tunnel| Graf
```

| Компонент | Назначение |
|-----------|------------|
| **node-exporter** | CPU, RAM, диск, сеть |
| **postgres-exporter** | соединения, размер БД, блокировки |
| **blackbox-exporter** | HTTP: `/api/health`, главная страница |
| **Prometheus** | хранение метрик 15 дней |
| **Grafana** | дашборды и (опционально) алерты |
| **Loki + Promtail** | логи nginx и PM2 (профиль `logs`, только при ≥4 GB RAM) |

Порты **9090** (Prometheus) и **3030** (Grafana) слушают только `127.0.0.1` — в интернет не выставляются.

## Установка на VPS

1. Убедитесь, что приложение и healthcheck работают:
   `curl -s http://127.0.0.1:3000/api/health`

2. Создайте read-only пользователя PostgreSQL для метрик:

```sql
CREATE USER krimvk_metrics WITH PASSWORD 'strong_random_password';
GRANT pg_monitor TO krimvk_metrics;
GRANT CONNECT ON DATABASE krimvk TO krimvk_metrics;
```

3. В каталоге репозитория на сервере:

```bash
cd /var/www/krimvk/monitoring
cp .env.example .env
nano .env   # GRAFANA_ADMIN_PASSWORD, POSTGRES_EXPORTER_DSN
chmod +x ../scripts/install-monitoring-vps.sh
../scripts/install-monitoring-vps.sh
```

4. Доступ к Grafana с вашего Mac:

```bash
ssh -L 3030:127.0.0.1:3030 krimvk@ВАШ_IP_VPS
```

Откройте http://localhost:3030 (логин из `.env`).

5. Дополнительные дашборды: **Dashboards → Import** (ID из Grafana.com):

| ID | Описание |
|----|----------|
| 1860 | Node Exporter Full |
| 9628 | PostgreSQL Database |
| 7587 | Blackbox Exporter |
| 12708 | Nginx (если включите stub_status) |

В репозитории уже есть дашборд **KrimVK — обзор VPS** (папка KrimVK).

## RAM 2 GB vs 4 GB+

| Профиль | Команда | Оценка RAM |
|---------|---------|------------|
| **core** (рекомендуется) | `docker compose --profile core up -d` | ~400–700 MB |
| **logs** | `docker compose --profile logs up -d` | +300–500 MB |

На **2 GB** держите только `core`. При нехватке памяти отключите dev-инстанс PM2 (`krimvk-dev`) или увеличьте VPS до 4 GB.

## Алерты (минимум)

1. **Внешний uptime** (бесплатно): [UptimeRobot](https://uptimerobot.com) или [Better Stack](https://betterstack.com) — проверка `https://ваш-домен/api/health` каждые 5 мин, уведомление в Telegram/email.

2. **Grafana alerting** (после входа): Alerting → Contact points → Telegram; правило на `probe_success == 0` или RAM > 90%.

3. **Резервные копии**: cron для `scripts/backup-db.sh` и `scripts/backup-uploads.sh`; раз в месяц тест `scripts/restore-db.sh` на копии.

## Безопасность — чеклист «полный контроль»

Выполните по порядку; детали — в [SERVER_HARDENING.md](./SERVER_HARDENING.md).

### Доступ

- [ ] SSH только по ключу, `PermitRootLogin no`, пользователь `krimvk` для деплоя
- [ ] `ufw`: 22 (или свой порт), 80, 443; остальное deny
- [ ] `fail2ban` для sshd и nginx (пример: `monitoring/fail2ban/jail.local.example`)

### Приложение

- [ ] PM2 только от `krimvk`, не от root
- [ ] Секреты только в `.env` на сервере и GitHub Secrets
- [ ] `NODE_ENV=production`, HTTPS и HSTS после домена

### Данные (152-ФЗ)

- [ ] VPS и БД в РФ; файлы в Yandex Object Storage (регион РФ)
- [ ] Страницы `/legal/*` и баннер cookies опубликованы
- [ ] Журнал согласий cookies (localStorage) — политика обновляется с версией

### Наблюдаемость

- [ ] Grafana через SSH-туннель или VPN (не открывать 3030 в ufw)
- [ ] Метрики health + blackbox на главную и `/api/health`
- [ ] Ротация логов: `pm2 install pm2-logrotate`, logrotate для nginx

### Nginx метрики (опционально)

В `nginx.conf` добавьте (только localhost):

```nginx
location /nginx_status {
    stub_status on;
    allow 127.0.0.1;
    deny all;
}
```

Перезагрузите nginx и при необходимости добавьте nginx-prometheus-exporter в `docker-compose.yml`.

## Обновление стека мониторинга

```bash
cd /var/www/krimvk
git pull
cd monitoring
docker compose --profile core pull
docker compose --profile core up -d
```

## Связанные документы

- [SERVER_HARDENING.md](./SERVER_HARDENING.md)
- [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md)
- [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
