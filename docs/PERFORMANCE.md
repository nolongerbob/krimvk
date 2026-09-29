# Производительность krimvk

## Baseline (Lighthouse)

Перед/после оптимизаций снимите отчёт для:

- `/` — LCP hero, blocking CSS
- `/news` — список с `next/image`
- `/dashboard` — ЛК (авторизованный)

```bash
npx lighthouse https://krimvk.ru --only-categories=performance --output=html --output-path=./lighthouse-home.html
```

Целевые метрики после фаз 1–2:

| Метрика | Цель |
|---------|------|
| LCP главной | < 2.5 s |
| TBT | < 200 ms |
| CLS | < 0.1 |

## Bundle analysis

```bash
npm run analyze
```

Откроет отчёт webpack bundle analyzer в браузере.

## Redis (VPS)

```bash
docker run -d --name redis --restart unless-stopped -p 127.0.0.1:6379:6379 redis:7-alpine
```

В `.env`:

```
REDIS_URL=redis://127.0.0.1:6379
```

Без Redis приложение использует in-memory fallback (один PM2-процесс).

## Миграция индексов

```bash
npm run build:vps
# или на сервере:
npx prisma migrate deploy
```

## Мониторинг

- PM2: `pm2 logs krimvk --lines 100`
- Медленные API: grep nginx access log на `/api/dashboard/overview`, `/api/1c/`
- 429: rate limit в middleware + nginx zones
