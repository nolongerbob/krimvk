# Статус аудита безопасности

Обновляйте после крупных релизов.

## Закрыто

| # | Тема | Коммит / где |
|---|------|----------------|
| 1 | Auto-login по `userId` | HMAC `loginToken`, `lib/post-verify-login-token.ts` |
| 2 | Публичные файлы заявок/чатов/счётчиков/договоров | `/api/files/private`, `docs/PRIVATE_FILES.md` |
| 3 | `password1c` plain в БД | AES-256-GCM, `docs/PASSWORD1C_ENCRYPTION.md` |
| 4 | CSP + заголовки | `lib/security/csp.js`, `next.config.js` |
| 5 | Админ только из БД | `requireAdmin()`, `app/admin/layout.tsx` |
| 6 | DaData без анонимного доступа | `/api/address/suggest` + сессия + rate limit |
| 7 | Rate limit приватных файлов | `http-guard.ts` → `/api/files/private` |
| 8 | IDOR: GET файлов заявки только для админа | `requireAdmin()` в `admin/applications/[id]/files` GET |
| 9 | IDOR: чужие фото в чате | `messages/{userId}/`, `lib/message-image-access.ts`, проверка при create |
| 10 | JWT `ADMIN` на приватных файлах | `canAccessPrivateS3Key` + `isAdminUser()` из БД |

## Открыто (аудит 2026-06)

| # | Тема | Где |
|---|------|-----|
| — | Пароли 1С в query (direct-account) | `app/api/admin/direct-account/*` |
| — | Allowlist `region` для 1С | `lib/1c-api.ts` |

## Операционно (на VPS)

- [ ] `PASSWORD1C_ENCRYPTION_KEY` + `migrate-encrypt-password1c.ts`
- [ ] Деплой `main`, smoke ЛК + админка
- [ ] `node scripts/audit-s3-private-prefixes.mjs` (старые public-read в S3, без aws CLI)
- [ ] `./scripts/audit-public-urls.sh`
- [ ] `sudo bash scripts/harden-vps.sh` (если не делали)

## По желанию

- [ ] CDN/WAF ([CLOUDFLARE.md](./CLOUDFLARE.md))
- [ ] Убрать дублирующие `role !== ADMIN` в `app/admin/*/page.tsx` (уже есть `layout`)
- [ ] `npm audit` / обновление зависимостей
- [ ] Локальные правки 1С (`normalize-1c-response`) — отдельный PR

## Проверка после деплоя

```bash
curl -sI https://krimvk.ru/api/address/suggest -X POST -H 'Content-Type: application/json' -d '{"query":"симф"}' | head -1
# ожидается 401 без cookie

curl -sI "https://krimvk.ru/files/applications/test" | head -1
# ожидается 403
```
