# Публичные URL — не светить IP VPS

Пользователи, письма и редиректы должны видеть только **https://krimvk.ru**, не IP сервера.

## .env на production (`/var/www/krimvk/.env`)

```env
SITE_URL=https://krimvk.ru
NEXTAUTH_URL=https://krimvk.ru
CANONICAL_HOST=krimvk.ru

S3_PUBLIC_VIA_PROXY=1
# Не задавайте S3_PUBLIC_URL_BASE с IP; лучше proxy через сайт

# 1С — только в .env, не в git:
ONE_C_API_BASE_URL=https://...
```

Проверка:

```bash
./scripts/check-site-url-env.sh
./scripts/audit-public-urls.sh
curl -sS https://krimvk.ru/api/site-config
```

После смены URL: **`npm run build && pm2 restart krimvk --update-env`**.

## Где URL формируется в коде

| Место | Защита |
|--------|--------|
| Письма (Resend) | `getSiteBaseUrl()` |
| Verify email redirect | `getSiteBaseUrl()` |
| Выход | `signOutToHome()` + `/api/site-config` |
| Заход по IP | middleware `canonicalHostRedirect` → домен |
| Логин без сессии | redirect base `getRedirectBaseUrl()` |
| Файлы `/api/public-file` | редирект на домен |
| Ссылки на файлы в S3 | `S3_PUBLIC_VIA_PROXY=1` → `/files/...` на домене |
| Алерты ntfy/Telegram | `getSiteHostname()` |
| 1С API | только `ONE_C_API_BASE_URL` в `.env` |

## Nginx (рекомендуется)

Отдельный `server` на IP с редиректом:

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 301 https://krimvk.ru$request_uri;
}
```

## Не попадает в браузер (но проверьте .env)

- `DATABASE_URL` — только сервер/БД
- `ONE_C_API_BASE_URL` — сервер → 1С
- Документация в `docs/` с IP — для админов, не для сайта

## Android

`API_BASE_URL` в приложении — **https://krimvk.ru**, не IP VPS.
