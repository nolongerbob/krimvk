# Мониторинг с телефона: ошибки, падения, «что сломалось»

## Россия: Telegram на телефоне часто недоступен

С **VPS** сообщения в Telegram API иногда уходят, но **прочитать на телефоне без VPN нельзя** — для алертов в РФ лучше:

| Способ | На телефоне | Настройка |
|--------|-------------|-----------|
| **Email** | Почта (Gmail/Yandex), push | UptimeRobot, Grafana |
| **ntfy** | Приложение [ntfy](https://ntfy.sh) | topic в `.env`, Grafana webhook |
| **Sentry** | Приложение Sentry | `SENTRY_DSN` |
| **UptimeRobot app** | Официальное приложение | Email + push в приложении |

Telegram в документе ниже — если есть VPN или алерты только на почту за рубежом.

---

Три уровня — от простого к детальному. На **2 GB RAM** рекомендуем **1 + 2**, третий по желанию.

| Уровень | Что ловит | С телефона (РФ) | Нагрузка на VPS |
|---------|-----------|-----------------|-----------------|
| **1. Uptime + Email/ntfy** | сайт недоступен | Почта / ntfy app | 0 |
| **2. Grafana → Email/ntfy** | RAM, диск, Postgres | Почта / ntfy app | 0 |
| **3. Sentry** | ошибки в коде | приложение Sentry | 0 |

---

## 1a. ntfy на телефон (рекомендуется в РФ, 5 минут)

1. На телефоне: установите **ntfy** ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)).
2. Придумайте секретный topic, например `krimvk-alerts-7f3a9c2e` (никому не показывайте).
3. В приложении: **+** → Subscribe to topic → введите этот topic.
4. На VPS в `/var/www/krimvk/.env`:

   ```env
   NTFY_TOPIC=krimvk-alerts-7f3a9c2e
   NTFY_SERVER=https://ntfy.sh
   ```

5. Тест:

   ```bash
   curl -d "KrimVK: тест" https://ntfy.sh/krimvk-alerts-7f3a9c2e
   ```

   Push должен прийти в приложение.

6. `pm2 restart krimvk --update-env` — краши Node тоже пойдут в ntfy.

### Как проверить, что алерт дойдёт

```bash
chmod +x /var/www/krimvk/scripts/test-ntfy-alert.sh
/var/www/krimvk/scripts/test-ntfy-alert.sh
```

Должен прийти push «KrimVK test».

**Что реально шлёт ntfy из приложения** (без Sentry):

| Событие | Придёт в ntfy? |
|---------|----------------|
| Тест `test-ntfy-alert.sh` / `curl` | ✅ |
| Краш Node (`uncaughtException`, необработанный Promise) | ✅ после `pm2 restart` |
| Обычная ошибка API 500 в `try/catch` | ❌ — нужен Sentry |
| Сайт упал | ✅ UptimeRobot → email/ntfy webhook |
| Мало RAM | ✅ Grafana → webhook/email |

**Grafana:** Alerting → Contact points → **Webhook** → URL `https://ntfy.sh/ваш-topic`, Method POST, Body = title + message (или используйте шаблон с заголовками `Title`, `Priority: high`).

---

## 1. Сайт упал → Email / UptimeRobot (5 минут)

### Вариант A — без VPS (рекомендуется)

1. [UptimeRobot](https://uptimerobot.com) (бесплатно) — регистрация.
2. **Add monitor** → HTTPS → `https://ваш-домен.ru/api/health`.
3. Интервал 5 мин → **Alert contacts** → **E-mail** (ваша почта на телефоне).
4. Установите приложение **UptimeRobot** — push без Telegram.
5. Дублировать монитор на главную `https://ваш-домен.ru/`.

### Вариант B — Uptime Kuma на VPS (красивый статус с телефона)

```bash
cd /var/www/krimvk/monitoring
docker compose --profile uptime up -d
```

С Mac:

```bash
ssh -L 3002:127.0.0.1:3002 krimvk@VPS_IP
```

Откройте http://localhost:3002 → создайте админа → добавьте мониторы (HTTP на сайт и `/api/health`) → **Settings → Notifications → Telegram**.

На телефоне: закладка на туннель или позже поддомен с HTTPS и basic auth.

---

## 2. Сервер «задыхается» → Grafana → Telegram

1. Создайте бота: в Telegram напишите [@BotFather](https://t.me/BotFather) → `/newbot` → скопируйте **token**.
2. Узнайте **chat_id**: напишите боту любое сообщение, откройте  
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → `"chat":{"id":123456789}`.

3. В Grafana (http://localhost:3030 через SSH-туннель):

   - **☰ → Alerting → Contact points → New contact point**
   - Type: **Telegram**
   - Bot token и Chat ID
   - **Test** → сообщение в Telegram

4. **Alerting → Notification policies** — default route на этот contact point.

5. **Alerting → Alert rules → New** — примеры:

   | Правило | PromQL | For |
   |---------|--------|-----|
   | Сайт down | `probe_success{job="blackbox_http",instance=~"http://127.0.0.1:3000.*"} == 0` | 2m |
   | Мало RAM | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.9` | 5m |
   | Диск | `(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) > 0.85` | 10m |
   | Postgres | `pg_up == 0` | 2m |

На телефоне: все алерты в **Telegram**.

---

## 3. Ошибки в коде (500, исключения) → Sentry + приложение на телефон

Лучший вариант для **«что именно сломалось в Next.js»** — [Sentry](https://sentry.io) (есть EU, бесплатный tier).

1. Проект **Next.js** в Sentry → скопируйте **DSN**.
2. На VPS в `/var/www/krimvk/.env`:

   ```env
   SENTRY_DSN=https://...@....ingest.sentry.io/...
   SENTRY_ENVIRONMENT=production
   ```

3. В репозитории (один раз на Mac, затем деплой):

   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

   Или следуйте [документации Sentry для Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/).

4. Установите приложение **Sentry** (iOS/Android) → войдите → видите ошибки, stack trace, push.

**152-ФЗ:** не отправляйте в Sentry ПДн (паспорта, телефоны) — в настройках Sentry включите scrubbing; в коде не логируйте `password`, `token` в `captureException`.

---

## 4. ntfy / Telegram при падении Node (VPS)

В `.env` на VPS:

```env
NTFY_TOPIC=ваш-секретный-topic
NTFY_SERVER=https://ntfy.sh
```

### Что **приходит** в ntfy (после обновления)

| Событие | Придёт? |
|---------|---------|
| Тест `./scripts/test-ntfy-alert.sh` | ✅ канал |
| `uncaughtException` / `unhandledRejection` | ✅ + **полный stack** |
| `console.error("...", error)` в API (большинство route) | ✅ + stack |
| Ответ API **5xx** (если route обёрнут в `withApiRoute`) | ✅ |
| Ошибка только в браузере (React) | ❌ → Sentry |
| «Сайт лежит», процесс жив | ❌ → UptimeRobot на `/api/health` |

Троттлинг: одна и та же ошибка не чаще чем раз в `NTFY_ALERT_COOLDOWN_MS` (по умолчанию 2 мин).

В `.env`:

```env
NTFY_TOPIC=ваш-секретный-topic
NTFY_ALERT_ENABLED=1
NTFY_ALERT_STACK=1
NTFY_ALERT_COOLDOWN_MS=120000
OPS_TEST_SECRET=длинная-случайная-строка
```

После смены: `pm2 restart krimvk --update-env && pm2 save`.

### Проверка полного алерта (stack)

```bash
# 1) Канал
/var/www/krimvk/scripts/test-ntfy-alert.sh

# 2) Полный формат (нужен OPS_TEST_SECRET в .env)
curl -fsS -X POST -H "X-Ops-Secret: $OPS_TEST_SECRET" https://krimvk.ru/api/ops/test-alert

# 3) Переменные в PM2
pm2 env krimvk | grep -E 'NTFY|OPS_TEST'
```

Для новых API можно обернуть handler: `export const GET = withApiRoute(async (req) => { ... });` — см. `lib/api-route.ts`.

Опционально Telegram: `TELEGRAM_ALERT_BOT_TOKEN` + `TELEGRAM_ALERT_CHAT_ID` (в РФ часто недоступен).

---

## Что выбрать

| Ваша цель | Решение |
|-----------|---------|
| «Сайт лёг» с телефона | UptimeRobot → Telegram |
| «Мало памяти / диск» | Grafana alert → Telegram |
| «Ошибка в форме / API 500» | Sentry + приложение |
| Красивый статус-борд | Uptime Kuma (`--profile uptime`) |

---

## SSH-туннели с телефона

На iPhone/Android: **Termius**, **Blink** — сохранить `ssh -L 3030:127.0.0.1:3030 krimvk@IP` или смотреть только **Telegram** (без туннеля) — для этого и настроены алерты.

Grafana/Sentry/Uptime Kuma в интернет **не выставляйте** без VPN или auth.

---

## Связанные документы

- [MONITORING_AND_SECURITY.md](./MONITORING_AND_SECURITY.md) — Prometheus/Grafana
- [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md) — инциденты
