# Приватные файлы в S3

## Поведение

| Префикс S3 | Доступ |
|------------|--------|
| `disclosure/`, `news/`, `water-quality/`, `pages/`, `posts/` | Публично: `/files/...` |
| `applications/`, `messages/`, `meters/`, `contracts/` | Только после входа: `/api/files/private/...` |

Новые загрузки сохраняются в S3 с ACL `private` (если `S3_USE_ACL` не `0`).

## Старые ссылки

Записи в БД с `/files/applications/...` в UI преобразуются в `/api/files/private/...` через `fileHrefForStoredUrl()`.

Файлы, загруженные ранее как `public-read` в бакете, остаются доступны по прямому URL бакета, пока не перевыложены — при необходимости смените ACL в Yandex Object Storage.

## Старые public-read ACL в бакете

```bash
set -a && source .env && set +a
node scripts/audit-s3-private-prefixes.mjs
# или
./scripts/audit-s3-private-prefixes.sh
```

AWS CLI не нужен — используется `@aws-sdk/client-s3` из проекта.

При `PUBLIC:` — перевыложите файл или смените ACL в Yandex Object Storage.

## Проверка

1. Без входа: `curl -I https://krimvk.ru/api/files/private/applications/...` → **401**
2. Без входа: `curl -I https://krimvk.ru/files/disclosure/...` → **200** (если файл есть)
3. В ЛК: документы заявок и фото счётчиков открываются в сессии
