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
| 11 | Пароли 1С в URL + `session` в direct-account | token-only API, POST connect, `resolve-direct-account-credentials` |
| 12 | Allowlist `region` для 1С (path injection) | `lib/1c-regions.ts`, `getRegion()` в `lib/1c-api.ts` |
| 13 | Telegram debug/DELETE, скрейп без лимита | `app/api/telegram/emergencies`, кэш 2 мин, rate limit |
| 14 | Спам формы аварии | `/api/emergency` лимит 5/15 мин + длины полей |
| 15 | Email автора в публичных новостях | `lib/format-public-author.ts` |
| 16 | SVG / подделка MIME в загрузках картинок | `lib/security/validate-image-upload.ts` |
| 17 | Публичные админ-загрузки без allowlist (posts/pages) | `lib/security/validate-upload.ts` |
| 18 | Спам чата / поиск / OCR / PDF | `http-guard.ts` лимиты |
| 19 | Перебор email при регистрации | `auth/register` — ответ как у «успеха» |
| 20 | Счётчики: фото + analyze-image | `validate-image-upload` на meters API |

## Открыто (аудит 2026-06)

| # | Тема | Где |
|---|------|-----|
| — | (критичных пунктов нет) | — |

## Операционно (на VPS)

- [ ] `PASSWORD1C_ENCRYPTION_KEY` + `migrate-encrypt-password1c.ts`
- [ ] Деплой `main`, smoke ЛК + админка
- [ ] `node scripts/audit-s3-private-prefixes.mjs` (старые public-read в S3, без aws CLI)
- [ ] `./scripts/audit-public-urls.sh`
- [ ] `sudo bash scripts/harden-vps.sh` (если не делали)

## По желанию

- [x] Верификация email — **оставляем как есть** (баннер + gate на auto-login)
- [ ] Redis rate limit вместо in-memory (несколько PM2-инстансов)
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
